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
