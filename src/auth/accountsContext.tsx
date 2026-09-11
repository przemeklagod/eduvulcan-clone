import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';
import { loginToEduVulcan } from '../api/eduvulcan/login';
import { registerTenant, refreshStudents } from '../api/hebe/register';
import { getHiddenChildren, loadAllTenants, removeTenant, saveTenant, setChildHidden as storeChildHidden } from './credentialStore';
import type { StoredTenant } from './credentialStore';

const DEVICE_MODEL = Platform.OS === 'ios' ? 'iPhone' : 'Android Device';

export interface ActiveSelection {
  tenant: string;
  pupilId: number;
}

function childKey(tenant: string, pupilId: number): string {
  return `${tenant}:${pupilId}`;
}

interface AccountsContextValue {
  tenants: StoredTenant[];
  loading: boolean;
  active: ActiveSelection | null;
  setActive: (selection: ActiveSelection) => void;
  hiddenChildren: Set<string>;
  setChildHidden: (tenant: string, pupilId: number, hidden: boolean) => Promise<void>;
  login: (username: string, password: string) => Promise<void>;
  logout: (tenant: string) => Promise<void>;
  refresh: () => Promise<void>;
}

const AccountsContext = createContext<AccountsContextValue | null>(null);

export function AccountsProvider({ children }: { children: React.ReactNode }) {
  const [tenants, setTenants] = useState<StoredTenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<ActiveSelection | null>(null);
  const [hiddenChildren, setHiddenChildren] = useState<Set<string>>(new Set());

  const refresh = useCallback(async () => {
    const [loaded, hidden] = await Promise.all([loadAllTenants(), getHiddenChildren()]);
    const hiddenSet = new Set(hidden);
    setTenants(loaded);
    setHiddenChildren(hiddenSet);
    setActive((current) => {
      if (current) return current;
      for (const t of loaded) {
        const visible = t.students.find((s) => !hiddenSet.has(childKey(t.credential.tenant, s.Pupil.Id)));
        if (visible) return { tenant: t.credential.tenant, pupilId: visible.Pupil.Id };
      }
      return null;
    });
  }, []);

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, [refresh]);

  // Silently re-fetch each tenant's student/period data in the background on
  // every app start - cheap (reuses the existing device credential, no new JWT
  // registration) and keeps Periods from going stale across a school-year
  // rollover. Best-effort: a failure here (offline, transient error) just means
  // the app keeps using whatever was already cached.
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
      setActive((current) => (current?.tenant === tenant ? null : current));
      await refresh();
    },
    [refresh]
  );

  const setChildHiddenAndRefresh = useCallback(
    async (tenant: string, pupilId: number, hidden: boolean) => {
      await storeChildHidden(tenant, pupilId, hidden);
      const key = childKey(tenant, pupilId);

      setHiddenChildren((current) => {
        const next = new Set(current);
        if (hidden) next.add(key);
        else next.delete(key);

        // If the currently active child was just hidden, fall back to another visible one.
        setActive((currentActive) => {
          if (!hidden || currentActive?.tenant !== tenant || currentActive.pupilId !== pupilId) return currentActive;
          for (const t of tenants) {
            const visible = t.students.find((s) => !next.has(childKey(t.credential.tenant, s.Pupil.Id)));
            if (visible) return { tenant: t.credential.tenant, pupilId: visible.Pupil.Id };
          }
          return null;
        });

        return next;
      });
    },
    [tenants]
  );

  const value = useMemo<AccountsContextValue>(
    () => ({
      tenants,
      loading,
      active,
      setActive,
      hiddenChildren,
      setChildHidden: setChildHiddenAndRefresh,
      login,
      logout,
      refresh,
    }),
    [tenants, loading, active, hiddenChildren, setChildHiddenAndRefresh, login, logout, refresh]
  );

  return <AccountsContext.Provider value={value}>{children}</AccountsContext.Provider>;
}

export function useAccounts(): AccountsContextValue {
  const ctx = useContext(AccountsContext);
  if (!ctx) throw new Error('useAccounts must be used within AccountsProvider');
  return ctx;
}

export function useActiveCredential() {
  const { tenants, active } = useAccounts();
  if (!active) return null;
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
