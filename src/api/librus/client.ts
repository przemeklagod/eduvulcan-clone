const SYNERGIA_BASE_URL = 'https://api.librus.pl/3.0';

export class LibrusApiError extends Error {
  constructor(
    public readonly endpoint: string,
    public readonly status: number,
    message: string
  ) {
    super(message);
  }
}

/** Simple bearer-token GET against api.librus.pl/3.0 - no request signing, unlike Vulcan's Hebe. */
export async function librusGet<T>(accessToken: string, path: string): Promise<T> {
  const response = await fetch(`${SYNERGIA_BASE_URL}${path}`, {
    headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' },
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new LibrusApiError(path, response.status, `Zapytanie Librus ${path} nie powiodło się (HTTP ${response.status})`);
  }

  return response.json() as Promise<T>;
}
