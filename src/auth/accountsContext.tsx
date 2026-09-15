import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';
import { loginToEduVulcan } from '../api/eduvulcan/login';
import { registerTenant, refreshStudents } from '../api/hebe/register';
import { getSynergiaAccounts, loginToLibrusPortal } from '../api/librus/auth';
import type { LibrusChildAccount } from '../api/librus/types';
import {
  getHiddenChildren,
  librusChildKey,
  loadAllLibrusAccounts,
  loadAllTenants,
  removeLibrusAccount,
  removeTenant,
  saveLibrusAccount,
  saveTenant,
  setChildHidden as storeChildHidden,
} from './credentialStore';
import type { StoredLibrusAccount, StoredTenant } from './credentialStore';

const DEVICE_MODEL = Platform.OS === 'ios' ? 'iPhone' : 'Android Device';

export type ActiveSelection =
  | { provider: 'vulcan'; tenant: string; pupilId: number }
  | { provider: 'librus'; portalEmail: string; childId: number };

function childKey(tenant: string, pupilId: number): string {
  return `${tenant}:${pupilId}`;
}

interface AccountsContextValue {
  tenants: StoredTenant[];
  librusAccounts: StoredLibrusAccount[];
  loading: boolean;
  active: ActiveSelection | null;
  setActive: (selection: ActiveSelection) => void;
  hiddenChildren: Set<string>;
  setChildHidden: (key: string, hidden: boolean) => Promise<void>;
  login: (username: string, password: string) => Promise<void>;
  logout: (tenant: string) => Promise<void>;
  loginLibrus: (email: string, password: string) => Promise<void>;
  logoutLibrus: (portalEmail: string) => Promise<void>;
  /** Re-logs into the Librus portal with the stored password and persists fresh bearer tokens for every child under that account (one portal login covers the whole family). */
  refreshLibrusToken: (portalEmail: string) => Promise<LibrusChildAccount[]>;
  refresh: () => Promise<void>;
}

const AccountsContext = createContext<AccountsContextValue | null>(null);

export function AccountsProvider({ children }: { children: React.ReactNode }) {
  const [tenants, setTenants] = useState<StoredTenant[]>([]);
  const [librusAccounts, setLibrusAccounts] = useState<StoredLibrusAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<ActiveSelection | null>(null);
  const [hiddenChildren, setHiddenChildren] = useState<Set<string>>(new Set());

  const refresh = useCallback(async () => {
    const [loaded, librusLoaded, hidden] = await Promise.all([
      loadAllTenants(),
      loadAllLibrusAccounts(),
      getHiddenChildren(),
    ]);
    const hiddenSet = new Set(hidden);
    setTenants(loaded);
    setLibrusAccounts(librusLoaded);
    setHiddenChildren(hiddenSet);
    setActive((current) => {
      if (current) return current;
      for (const t of loaded) {
        const visible = t.students.find((s) => !hiddenSet.has(childKey(t.credential.tenant, s.Pupil.Id)));
        if (visible) return { provider: 'vulcan', tenant: t.credential.tenant, pupilId: visible.Pupil.Id };
      }
      for (const a of librusLoaded) {
        const visible = a.children.find((c) => !hiddenSet.has(librusChildKey(c.id)));
        if (visible) return { provider: 'librus', portalEmail: a.portalEmail, childId: visible.id };
      }
      return null;
    });
  }, []);

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, [refresh]);

  // Silently re-fetch each Vulcan tenant's student/period data in the
  // background on every app start - cheap (reuses the existing device
  // credential, no new JWT registration) and keeps Periods from going stale
  // across a school-year rollover. Best-effort: a failure here (offline,
  // transient error) just means the app keeps using whatever was cached.
  // (Librus bearer-token refresh is a separate, not-yet-implemented concern -
  // see the Librus integration plan.)
  useEffect(() => {
    let cancelled = false;

    (async () => {
      const loaded = await loadAllTenants();
      for (const { credential } of loaded) {
        try {
          const students = await refreshStudents(credential);
          if (cancelled) return;
          await saveTenant(credential.tenant, credential, students);
        } catch (e) {
          console.error(`Failed to refresh students for tenant ${credential.tenant}`, e);
        }
      }
      if (!cancelled) await refresh();
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = useCallback(
    async (username: string, password: string) => {
      const session = await loginToEduVulcan(username, password);

      for (const [tenant, jwts] of session.tenantTokens) {
        const { credential, students } = await registerTenant(tenant, jwts, DEVICE_MODEL);
        await saveTenant(tenant, credential, students);
      }

      await refresh();
    },
    [refresh]
  );

  const logout = useCallback(
    async (tenant: string) => {
      await removeTenant(tenant);
      setActive((current) => (current?.provider === 'vulcan' && current.tenant === tenant ? null : current));
      await refresh();
    },
    [refresh]
  );

  const loginLibrus = useCallback(
    async (email: string, password: string) => {
      await loginToLibrusPortal(email, password);
      const { accounts } = await getSynergiaAccounts();
      await saveLibrusAccount(email, password, accounts);
      await refresh();
    },
    [refresh]
  );

  const logoutLibrus = useCallback(
    async (portalEmail: string) => {
      await removeLibrusAccount(portalEmail);
      setActive((current) => (current?.provider === 'librus' && current.portalEmail === portalEmail ? null : current));
      await refresh();
    },
    [refresh]
  );

  const refreshLibrusToken = useCallback(
    async (portalEmail: string): Promise<LibrusChildAccount[]> => {
      const account = librusAccounts.find((a) => a.portalEmail === portalEmail);
      if (!account) throw new Error(`Nie znaleziono zapisanego konta Librus dla ${portalEmail}`);

      await loginToLibrusPortal(portalEmail, account.portalPassword);
      const { accounts } = await getSynergiaAccounts();
      await saveLibrusAccount(portalEmail, account.portalPassword, accounts);
      await refresh();
      return accounts;
    },
    [librusAccounts, refresh]
  );

  const setChildHiddenAndRefresh = useCallback(
    async (key: string, hidden: boolean) => {
      await storeChildHidden(key, hidden);

      setHiddenChildren((current) => {
        const next = new Set(current);
        if (hidden) next.add(key);
        else next.delete(key);

        // If the currently active child was just hidden, fall back to another visible one.
        setActive((currentActive) => {
          if (!hidden || !currentActive) return currentActive;
          const currentKey =
            currentActive.provider === 'vulcan'
              ? childKey(currentActive.tenant, currentActive.pupilId)
              : librusChildKey(currentActive.childId);
          if (currentKey !== key) return currentActive;

          for (const t of tenants) {
            const visible = t.students.find((s) => !next.has(childKey(t.credential.tenant, s.Pupil.Id)));
            if (visible) return { provider: 'vulcan', tenant: t.credential.tenant, pupilId: visible.Pupil.Id };
          }
          for (const a of librusAccounts) {
            const visible = a.children.find((c) => !next.has(librusChildKey(c.id)));
            if (visible) return { provider: 'librus', portalEmail: a.portalEmail, childId: visible.id };
          }
          return null;
        });

        return next;
      });
    },
    [tenants, librusAccounts]
  );

  const value = useMemo<AccountsContextValue>(
    () => ({
      tenants,
      librusAccounts,
      loading,
      active,
      setActive,
      hiddenChildren,
      setChildHidden: setChildHiddenAndRefresh,
      login,
      logout,
      loginLibrus,
      logoutLibrus,
      refreshLibrusToken,
      refresh,
    }),
    [
      tenants,
      librusAccounts,
      loading,
      active,
      hiddenChildren,
      setChildHiddenAndRefresh,
      login,
      logout,
      loginLibrus,
      logoutLibrus,
      refreshLibrusToken,
      refresh,
    ]
  );

  return <AccountsContext.Provider value={value}>{children}</AccountsContext.Provider>;
}

export function useAccounts(): AccountsContextValue {
  const ctx = useContext(AccountsContext);
  if (!ctx) throw new Error('useAccounts must be used within AccountsProvider');
  return ctx;
}

/**
 * Vulcan-only - returns null (not an error) when the active selection is a
 * Librus child, so every existing Vulcan-specific data hook keeps working
 * completely unchanged and just renders its "no active student" empty state
 * for a Librus-backed child.
 */
export function useActiveCredential() {
  const { tenants, active } = useAccounts();
  if (!active || active.provider !== 'vulcan') return null;
  const stored = tenants.find((t) => t.credential.tenant === active.tenant);
  if (!stored) return null;

  // Domain calls (grades/schedule/...) must hit the active pupil's own reporting
  // unit, not the tenant-wide registration URL - Vulcan can host multiple schools
  // under one tenant, each with its own unit REST path (confirmed live: two
  // schools under the same "lublin" tenant had different Unit.RestURL values).
  const student = stored.students.find((s) => s.Pupil.Id === active.pupilId);
  const credential = student ? { ...stored.credential, restUrl: student.Unit.RestURL } : stored.credential;

  return { credential, pupilId: active.pupilId, students: stored.students };
}

/** Librus counterpart to useActiveCredential() - null unless the active selection is a Librus child. */
export function useActiveLibrusChild() {
  const { librusAccounts, active } = useAccounts();
  if (!active || active.provider !== 'librus') return null;
  const account = librusAccounts.find((a) => a.portalEmail === active.portalEmail);
  if (!account) return null;
  const child = account.children.find((c) => c.id === active.childId);
  if (!child) return null;

  return { portalEmail: account.portalEmail, portalPassword: account.portalPassword, child };
}
