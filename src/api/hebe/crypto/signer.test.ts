import { createVerify } from 'crypto';
import { generateRsaCredentialKeys } from './keypair';
import { buildSignatureHeaders, canonicalUrlFor, digestFor, formatVDate } from './signer';

describe('canonicalUrlFor', () => {
  it('matches the reference test vector', () => {
    expect(canonicalUrlFor('/powiatwulkanowy/123456/api/mobile/register/hebe')).toBe(
      'api%2fmobile%2fregister%2fhebe'
    );
  });

  it('throws when the path has no api/mobile/ segment', () => {
    expect(() => canonicalUrlFor('/foo/bar')).toThrow();
  });
});

describe('digestFor', () => {
  it('matches the reference test vector for body "{}"', () => {
    expect(digestFor('{}')).toBe('RBNvo1WzZ4oRRq0W9+hknpT7T8If536DEMBg9hyq/4o=');
  });
});

describe('formatVDate', () => {
  it('formats as an RFC1123 GMT string', () => {
    const date = new Date(Date.UTC(2020, 3, 14, 4, 14, 16));
    expect(formatVDate(date)).toBe('Tue, 14 Apr 2020 04:14:16 GMT');
  });
});

describe('buildSignatureHeaders', () => {
  it('produces a signature that verifies against the same public key, and self-consistent header wiring', () => {
    const { publicKeyPem, privateKeyPem, fingerprint } = generateRsaCredentialKeys();
    const path = '/warszawa/1/api/mobile/grade/byPupil';
    const body = JSON.stringify({ Envelope: { pupilId: 1 } });
    const now = new Date(Date.UTC(2026, 0, 1, 12, 0, 0));

    const headers = buildSignatureHeaders(fingerprint, privateKeyPem, path, body, now);

    expect(headers.vCanonicalUrl).toBe('api%2fmobile%2fgrade%2fbypupil');
    expect(headers.Digest).toBe(`SHA-256=${digestFor(body)}`);
    expect(headers.vDate).toBe('Thu, 01 Jan 2026 12:00:00 GMT');

    const match = headers.Signature.match(
      /^keyId="([^"]+)",headers="([^"]+)",algorithm="sha256",signature=Base64\(sha256withrsa\((.+)\)\)$/
    );
    expect(match).not.toBeNull();
    const [, keyId, signedHeaderNames, rawSignature] = match!;
    expect(keyId).toBe(fingerprint);
    expect(signedHeaderNames).toBe('vCanonicalUrl Digest vDate');

    const signedContent = headers.vCanonicalUrl + digestFor(body) + headers.vDate;
    const verifier = createVerify('RSA-SHA256');
    verifier.update(signedContent, 'utf8');
    expect(verifier.verify(publicKeyPem, rawSignature, 'base64')).toBe(true);
  });

  it('omits the Digest header for bodyless (GET) requests', () => {
    const { privateKeyPem, fingerprint } = generateRsaCredentialKeys();
    const headers = buildSignatureHeaders(fingerprint, privateKeyPem, '/x/1/api/mobile/grade/byPupil', null);

    expect(headers.Digest).toBeUndefined();
    expect(headers.Signature).toContain('headers="vCanonicalUrl vDate"');
  });
});
