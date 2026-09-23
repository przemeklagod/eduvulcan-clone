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
 * Simple bearer-token GET against api.librus.pl/3.0 - no request signing,
 * unlike Vulcan's Hebe. Deliberately doesn't pass `cache: 'no-store'`:
 * confirmed live that React Native's fetch appends a `?_=<timestamp>`
 * cache-busting query param when that option is set (the same trick
 * jQuery.ajax used to do, since XHR has no native no-store concept), and
 * Librus's API rejects any request carrying an unrecognized query param
 * with a generic 400 "InvalidRequest" - reproduced 1:1 against a real
 * account. Vulcan's hebeGet never set this option, which is why it was
 * never affected.
 */
export async function librusGet<T>(accessToken: string, path: string): Promise<T> {
  const response = await fetch(`${SYNERGIA_BASE_URL}${path}`, {
    headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json', 'User-Agent': MOBILE_UA },
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new LibrusApiError(
      path,
      response.status,
      `Zapytanie Librus ${path} nie powiodło się (HTTP ${response.status})${body ? `: ${body.slice(0, 300)}` : ''}`
    );
  }

  return response.json() as Promise<T>;
}
