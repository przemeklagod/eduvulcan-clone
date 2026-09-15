import { LibrusApiError } from '../api/librus/client';
import { LibrusWiadomosciError } from '../api/librus/wiadomosci';
import { useAccounts, useActiveLibrusChild } from '../auth/accountsContext';

function isUnauthorized(e: unknown): boolean {
  return (e instanceof LibrusApiError || e instanceof LibrusWiadomosciError) && e.status === 401;
}

/**
 * Unlike Vulcan's RSA device cert (which never expires), Librus's per-child
 * bearer tokens do expire - this wraps a Librus API call so a 401 triggers
 * one portal re-login (with the stored password) and a single retry with the
 * fresh token, instead of surfacing the error to the user.
 */
export function useLibrusQuery() {
  const { refreshLibrusToken } = useAccounts();
  const activeChild = useActiveLibrusChild();

  async function run<T>(apiCall: (accessToken: string) => Promise<T>): Promise<T> {
    if (!activeChild) throw new Error('Brak aktywnego dziecka z Librusa');

    try {
      return await apiCall(activeChild.child.accessToken);
    } catch (e) {
      if (!isUnauthorized(e)) throw e;

      const refreshedChildren = await refreshLibrusToken(activeChild.portalEmail);
      const fresh = refreshedChildren.find((c) => c.id === activeChild.child.id);
      if (!fresh) throw e;

      return apiCall(fresh.accessToken);
    }
  }

  return { activeChild, run };
}
