import { createHash, generateKeyPairSync } from 'crypto';

export interface RsaCredentialKeys {
  /** PEM-wrapped SPKI public key, e.g. "-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----\n" */
  publicKeyPem: string;
  /** base64 of the raw SPKI DER bytes (no PEM header/footer) - goes in the "Certificate" field */
  publicKeyBase64: string;
  /** PEM-wrapped PKCS8 private key, used for signing */
  privateKeyPem: string;
  /** hex(MD5(publicKeyPem)) - used as both keyId (signing) and CertificateThumbprint (registration) */
  fingerprint: string;
}

export function generateRsaCredentialKeys(): RsaCredentialKeys {
  const { publicKey, privateKey } = generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  }) as unknown as { publicKey: string; privateKey: string };

  return {
    publicKeyPem: publicKey,
    publicKeyBase64: pemBodyToBase64(publicKey),
    privateKeyPem: privateKey,
    fingerprint: createHash('md5').update(publicKey).digest('hex'),
  };
}

function pemBodyToBase64(pem: string): string {
  return pem
    .replace(/-----BEGIN [^-]+-----/, '')
    .replace(/-----END [^-]+-----/, '')
    .replace(/\r?\n/g, '')
    .trim();
}
