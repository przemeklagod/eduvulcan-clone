import { createHash } from 'crypto';

/**
 * Port of POWCaptchaResolver.computeCaptchaResponse from szponciciel04/DzienniczekSzpontniczek.
 * Each round's SHA-256 input is challenge_bytes + all previously found nonces' ASCII digits
 * (concatenated in place, no separators) + the current candidate nonce's ASCII digits.
 */
export function solveCaptchaPow(challenge: string, difficulty: number, rounds: number): string {
  if (rounds < 0) throw new Error('rounds must be non-negative');
  if (difficulty < 0 || difficulty > 0xffffffff) throw new Error('difficulty out of range');

  const buf = new Uint8Array(512);
  let len = 0;
  for (let i = 0; i < challenge.length; i++) buf[len++] = challenge.charCodeAt(i) & 0xff;

  const writeAsciiLong = (value: number, start: number): number => {
    let v = value;
    let pos = start;
    do {
      buf[pos++] = (v % 10) + 48;
      v = Math.floor(v / 10);
    } while (v !== 0);

    let i = start;
    let j = pos - 1;
    while (i < j) {
      const tmp = buf[i];
      buf[i] = buf[j];
      buf[j] = tmp;
      i++;
      j--;
    }
    return pos;
  };

  const results: number[] = [];

  for (let round = 0; round < rounds; round++) {
    let nonce = 1;
    let writeEnd = len;
    let found = false;

    while (nonce <= 1_000_000_000) {
      writeEnd = writeAsciiLong(nonce, len);
      const digest = createHash('sha256').update(Buffer.from(buf.subarray(0, writeEnd))).digest();
      const value = ((digest[0] << 24) | (digest[1] << 16) | (digest[2] << 8) | digest[3]) >>> 0;

      if (value < difficulty) {
        found = true;
        break;
      }
      nonce++;
    }

    if (!found) throw new Error('Failed to find captcha nonce within 1e9 attempts');

    results.push(nonce);
    len = writeEnd;
  }

  return results.join(';');
}
