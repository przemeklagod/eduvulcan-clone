const SYNERGIA_BASE_URL = 'https://api.librus.pl/3.0';

// Librus's edge/WAF appears to care about this for at least some endpoints -
// confirmed necessary for the (now-removed) wiadomosci.librus.pl bridge's
// /2.0/AutoLoginToken call. Sending it on every api.librus.pl/3.0 request too
// removes the ambiguity of whatever RN's fetch sends by default.
const MOBILE_UA = 'Librus Mobile/6.0.0 (iPhone; iOS 17.0)';

export class LibrusApiError extends Error {
  constructor(
    public readonly endpoint: string,
    public readonly status: number,
    message: string
  ) {
    super(message);
  }
}

/**
 * Redacted-but-comparable summary of the token actually used for a failed
 * request - not the full secret, but enough (length + edges) to tell
 * whether the app is holding the same token a fresh login would produce, or
 * something truncated/stale/different. Temporary diagnostic aid for a 400
 * "Invalid request params" that only ever reproduces on-device.
 */
function describeToken(accessToken: string): string {
  const len = accessToken.length;
  const head = accessToken.slice(0, 8);
  const tail = accessToken.slice(-8);
  const hasHash = accessToken.includes('#');
  return `len=${len} head="${head}" tail="${tail}" hasHash=${hasHash}`;
}

/** Simple bearer-token GET against api.librus.pl/3.0 - no request signing, unlike Vulcan's Hebe. */
export async function librusGet<T>(accessToken: string, path: string): Promise<T> {
  const url = `${SYNERGIA_BASE_URL}${path}`;
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json', 'User-Agent': MOBILE_UA },
    cache: 'no-store',
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new LibrusApiError(
      path,
      response.status,
      `Zapytanie Librus ${path} nie powiodło się (HTTP ${response.status})${body ? `: ${body.slice(0, 300)}` : ''}\n[diag] url=${url} token(${describeToken(accessToken)})`
    );
  }

  return response.json() as Promise<T>;
}
