import type { LibrusWiadomosciDetail, LibrusWiadomosciListItem } from './types';

const MOBILE_UA = 'Librus Mobile/6.0.0 (iPhone; iOS 17.0)';
const DESKTOP_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36';
const WIADOMOSCI_BASE_URL = 'https://wiadomosci.librus.pl';

export class LibrusWiadomosciError extends Error {}

async function requestAutoLoginToken(accessToken: string): Promise<string> {
  const response = await fetch('https://api.librus.pl/2.0/AutoLoginToken', {
    method: 'POST',
    headers: { Accept: 'application/json', Authorization: `Bearer ${accessToken}`, 'User-Agent': MOBILE_UA },
    cache: 'no-store',
  });
  if (!response.ok) {
    throw new LibrusWiadomosciError(`Nie udało się uzyskać tokenu logowania do wiadomości Librus (HTTP ${response.status})`);
  }
  const json = (await response.json()) as { Token?: string };
  if (!json.Token) throw new LibrusWiadomosciError('Brak tokenu logowania w odpowiedzi Librusa');
  return json.Token;
}

/**
 * Bridges the per-child api.librus.pl bearer token into a
 * synergia.librus.pl + wiadomosci.librus.pl cookie session - messages don't
 * live on the api.librus.pl/3.0 backend used by Grades/Schedule/Attendance/
 * HomeWorks. Each hop's auth artifact travels in the URL path (not a
 * cookie), and every response's Set-Cookie stays scoped to the host that
 * issued it (confirmed live: no cookie ever needed a Domain spanning
 * multiple *.librus.pl hosts) - so a standard cookie jar (RN's fetch with
 * credentials: 'include') carries this through with no manual cookie
 * plumbing, the same way it already does for the portal login flow.
 */
export async function establishWiadomosciSession(accessToken: string): Promise<void> {
  const autoLoginToken = await requestAutoLoginToken(accessToken);

  const loginResponse = await fetch(
    `https://synergia.librus.pl/loguj/token/${autoLoginToken}/przenies/uczen/widok/centrum_powiadomien`,
    { headers: { 'User-Agent': MOBILE_UA }, credentials: 'include', cache: 'no-store' }
  );
  if (!loginResponse.ok) {
    throw new LibrusWiadomosciError(`Logowanie do wiadomości Librus nie powiodło się (HTTP ${loginResponse.status})`);
  }

  const bridgeResponse = await fetch('https://synergia.librus.pl/wiadomosci3', {
    headers: { 'User-Agent': DESKTOP_UA },
    credentials: 'include',
    cache: 'no-store',
  });
  if (!bridgeResponse.ok) {
    throw new LibrusWiadomosciError(`Aktywacja wiadomości Librus nie powiodła się (HTTP ${bridgeResponse.status})`);
  }
}

async function wiadomosciGet<T>(path: string): Promise<T> {
  const response = await fetch(`${WIADOMOSCI_BASE_URL}${path}`, {
    headers: { Accept: 'application/json', 'User-Agent': DESKTOP_UA },
    credentials: 'include',
    cache: 'no-store',
  });
  if (!response.ok) {
    throw new LibrusWiadomosciError(`Zapytanie do wiadomości Librus nie powiodło się (HTTP ${response.status}, ${path})`);
  }
  return response.json() as Promise<T>;
}

/** Assumes establishWiadomosciSession() already ran in this call chain - inbox only, Librus has no sent/deleted folder API. */
export async function getInboxMessages(): Promise<LibrusWiadomosciListItem[]> {
  const { data } = await wiadomosciGet<{ data: LibrusWiadomosciListItem[] }>('/api/inbox/messages?page=1&limit=300');
  return data;
}

export async function getInboxMessageDetail(messageId: string): Promise<LibrusWiadomosciDetail> {
  const { data } = await wiadomosciGet<{ data: LibrusWiadomosciDetail }>(`/api/inbox/messages/${messageId}`);
  return data;
}
