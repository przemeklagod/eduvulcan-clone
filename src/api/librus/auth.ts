import { extractAttr, extractTag } from '../eduvulcan/html';
import type { SynergiaAccountsResponse } from './types';

const PORTAL_BASE_URL = 'https://portal.librus.pl';

export class LibrusAuthError extends Error {}

/**
 * Logs into the Librus parent portal (email+password, cookie session + CSRF
 * token) - confirmed against andrewkoltsov/librus-sdk's PortalClient.login.
 * RN's fetch already keeps cookies across calls on iOS (same as the eduVulcan
 * web login in ../eduvulcan/login.ts), so no cookie-jar library is needed.
 */
export async function loginToLibrusPortal(email: string, password: string): Promise<void> {
  const loginPageUrl = `${PORTAL_BASE_URL}/konto-librus/login`;
  const loginPageResponse = await fetch(loginPageUrl, { credentials: 'include' });
  if (!loginPageResponse.ok) throw new LibrusAuthError(`Nie udało się otworzyć strony logowania Librus (HTTP ${loginPageResponse.status})`);

  const loginPageHtml = await loginPageResponse.text();
  const tokenTag = extractTag(loginPageHtml, /<input[^>]*name="_token"[^>]*>/);
  const csrfToken = extractAttr(tokenTag, 'value');
  if (!csrfToken) throw new LibrusAuthError('Nie znaleziono tokenu CSRF na stronie logowania Librus');

  const body = new URLSearchParams({ email, password, _token: csrfToken }).toString();
  const loginActionResponse = await fetch(`${PORTAL_BASE_URL}/konto-librus/login/action`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Referer: loginPageUrl },
    body,
    credentials: 'include',
  });
  if (!loginActionResponse.ok) throw new LibrusAuthError('Logowanie do Librusa nie powiodło się - sprawdź e-mail i hasło.');
}

async function getPortalJson<T>(path: string): Promise<T> {
  const response = await fetch(`${PORTAL_BASE_URL}/api/v3${path}`, {
    headers: { Accept: 'application/json' },
    credentials: 'include',
  });
  if (!response.ok) throw new LibrusAuthError(`Zapytanie do portalu Librus nie powiodło się (HTTP ${response.status}, ${path})`);
  return response.json() as Promise<T>;
}

/** Requires an active portal session from loginToLibrusPortal - one entry per linked child, each with its own bearer token. */
export function getSynergiaAccounts(): Promise<SynergiaAccountsResponse> {
  return getPortalJson<SynergiaAccountsResponse>('/SynergiaAccounts');
}
