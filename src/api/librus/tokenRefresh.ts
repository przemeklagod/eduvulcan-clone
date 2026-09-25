import { getSynergiaAccounts, loginToLibrusPortal } from './auth';
import { LibrusApiError } from './client';
import { loadLibrusAccount, saveLibrusAccount } from '../../auth/credentialStore';
import type { LibrusChildAccount } from './types';

function isUnauthorized(e: unknown): boolean {
  return e instanceof LibrusApiError && e.status === 401;
}

/**
 * Re-logs into the Librus portal with the stored password and persists
 * fresh bearer tokens for every child under that account (one portal login
 * covers the whole family). Plain function (no React) so it's usable from
 * both the AccountsProvider context and the headless background-check task.
 */
export async function refreshLibrusTokenFor(portalEmail: string): Promise<LibrusChildAccount[]> {
  const account = await loadLibrusAccount(portalEmail);
  if (!account) throw new Error(`Nie znaleziono zapisanego konta Librus dla ${portalEmail}`);

  await loginToLibrusPortal(portalEmail, account.portalPassword);
  const { accounts } = await getSynergiaAccounts();
  await saveLibrusAccount(portalEmail, account.portalPassword, accounts);
  return accounts;
}

/**
 * Runs a Librus API call, transparently refreshing the token and retrying
 * once on a 401 - unlike Vulcan's RSA device cert, Librus's per-child bearer
 * tokens do expire.
 */
export async function runLibrusApiCall<T>(
  portalEmail: string,
  childId: number,
  accessToken: string,
  apiCall: (accessToken: string) => Promise<T>
): Promise<T> {
  try {
    return await apiCall(accessToken);
  } catch (e) {
    if (!isUnauthorized(e)) throw e;

    const refreshedChildren = await refreshLibrusTokenFor(portalEmail);
    const fresh = refreshedChildren.find((c) => c.id === childId);
    if (!fresh) throw e;

    return apiCall(fresh.accessToken);
  }
}
