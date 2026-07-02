import { createHash, createSign } from 'crypto';

export interface SignedHeaders {
  vCanonicalUrl: string;
  vDate: string;
  Digest?: string;
  Signature: string;
}

/**
 * Ported from HebeSzpontSigner.kt (szponciciel04/DzienniczekSzpontniczek).
 * The path must contain "api/mobile/..." - only that suffix is signed.
 */
export function canonicalUrlFor(pathOrUrl: string): string {
  const match = pathOrUrl.match(/(api\/mobile\/.+)/);
  if (!match) throw new Error(`Path does not contain api/mobile/...: ${pathOrUrl}`);
  return encodeURIComponent(match[1]).toLowerCase();
}

export function digestFor(body: string): string {
  return createHash('sha256').update(body, 'utf8').digest('base64');
}

export function formatVDate(date: Date): string {
  // e.g. "Tue, 14 Apr 2020 04:14:16 GMT" - matches "EEE, dd MMM yyyy HH:mm:ss 'GMT'"
  return date.toUTCString();
}

/**
 * Builds the vCanonicalUrl/vDate/Digest/Signature headers for one Hebe request.
 * `keyId` is the RSA credential's fingerprint (see keypair.ts).
 */
export function buildSignatureHeaders(
  keyId: string,
  privateKeyPem: string,
  path: string,
  body: string | null,
  now: Date = new Date()
): SignedHeaders {
  const canonicalUrl = canonicalUrlFor(path);
  const digestValue = body != null ? digestFor(body) : undefined;
  const vDate = formatVDate(now);

  const signedFieldNames = ['vCanonicalUrl', ...(digestValue ? ['Digest'] : []), 'vDate'];
  const signedContent = canonicalUrl + (digestValue ?? '') + vDate;

  const signature = createSign('RSA-SHA256').update(signedContent, 'utf8').sign(privateKeyPem, 'base64');

  const signatureHeader =
    `keyId="${keyId}",headers="${signedFieldNames.join(' ')}",algorithm="sha256",` +
    `signature=Base64(sha256withrsa(${signature}))`;

  return {
    vCanonicalUrl: canonicalUrl,
    vDate,
    ...(digestValue ? { Digest: `SHA-256=${digestValue}` } : {}),
    Signature: signatureHeader,
  };
}
