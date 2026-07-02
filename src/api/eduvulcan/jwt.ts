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

export function buildTenantTokenMap(tokens: string[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const token of tokens) {
    const payload = decodeJwt(token);
    map.set(payload.tenant, token);
  }
  return map;
}
