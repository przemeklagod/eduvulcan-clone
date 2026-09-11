import { randomUUID } from 'crypto';
import { hebeGet, hebePost } from './client';
import type { HebeCredential } from './client';
import { generateRsaCredentialKeys } from './crypto/keypair';
import type { JwtRegisterRequest } from './types/register';
import type { Account } from './types/account';

const HEBECE_BASE_URL = 'https://lekcjaplus.vulcan.net.pl';

export interface RegisteredTenant {
  credential: HebeCredential;
  students: Account[];
}

/**
 * Registers a new device credential for one eduVulcan tenant, using ALL of that
 * tenant's JWTs from the Stage 1 web login in a single call. A tenant can carry
 * multiple children (and multiple schools per child) as separate JWTs that all
 * share the same `tenant` value - the registration payload's `Tokens` field is
 * an array specifically to bind them all to one device credential in one shot.
 * Ported from SzpontHebeCeApi.registerByJwt.
 */
export async function registerTenant(tenant: string, jwts: string[], deviceModel: string): Promise<RegisteredTenant> {
  const keys = generateRsaCredentialKeys();

  const credential: HebeCredential = {
    tenant,
    restUrl: `${HEBECE_BASE_URL}/${tenant}/api`,
    privateKeyPem: keys.privateKeyPem,
    fingerprint: keys.fingerprint,
    deviceId: randomUUID(),
    deviceOs: 'iOS',
    deviceModel,
  };

  const payload: JwtRegisterRequest = {
    OS: credential.deviceOs,
    Certificate: keys.publicKeyBase64,
    CertificateType: 'RSA_PEM',
    DeviceModel: deviceModel,
    SelfIdentifier: credential.deviceId,
    CertificateThumbprint: keys.fingerprint,
    Tokens: jwts,
  };

  await hebePost(credential, 'mobile/register/jwt', payload);

  const students = await hebeGet<Account[]>(credential, 'mobile/register/hebe', { mode: 2 });

  return { credential, students };
}

/**
 * Re-fetches each pupil's account record (Periods, Unit, MessageBox, ...) using
 * an already-registered device credential - no new RSA keypair or JWT re-registration
 * needed, since the device certificate itself doesn't expire with the school year.
 * Periods are only ever fetched once at login otherwise, which goes stale the moment
 * a new school year starts (the server then rejects the old, cached period ids with
 * "Selected period is not in current school year") - callers should run this
 * periodically (e.g. on app start) to keep stored student data current.
 */
export async function refreshStudents(credential: HebeCredential): Promise<Account[]> {
  return hebeGet<Account[]>(credential, 'mobile/register/hebe', { mode: 2 });
}
