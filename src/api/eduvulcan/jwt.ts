export interface JwtPayload {
  name: string;
  uid: string;
  tenant: string;
  unituid: string;
  uri: string;
  service: unknown;
  caps: unknown;
  nbf: number;
  exp: number;
  iat: number;
}

export function decodeJwt(token: string): JwtPayload {
  const parts = token.split('.');
  if (parts.length < 2) throw new Error('Invalid JWT: expected at least 2 segments');

  let payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
  while (payload.length % 4 !== 0) payload += '=';

  const json = Buffer.from(payload, 'base64').toString('utf8');
  return JSON.parse(json) as JwtPayload;
}

/**
 * Groups JWTs by tenant. Multiple children (and even multiple schools for the
 * same child) can share one tenant - each becomes its own token, all of which
 * must be sent together to `mobile/register/jwt` so the single device
 * credential for that tenant sees every pupil (confirmed live: a family of 4
 * children all resolved to tenant "lublin", 5 tokens total).
 */
export function buildTenantTokenMap(tokens: string[]): Map<string, string[]> {
  const map = new Map<string, string[]>();
  for (const token of tokens) {
    const payload = decodeJwt(token);
    const existing = map.get(payload.tenant);
    if (existing) existing.push(token);
    else map.set(payload.tenant, [token]);
  }
  return map;
}
