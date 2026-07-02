import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';
import { loginToEduVulcan } from '../api/eduvulcan/login';
import { registerTenant } from '../api/hebe/register';
import { loadAllTenants, removeTenant, saveTenant } from './credentialStore';
import type { StoredTenant } from './credentialStore';

const DEVICE_MODEL = Platform.OS === 'ios' ? 'iPhone' : 'Android Device';

export interface ActiveSelection {
  tenant: string;
  pupilId: number;
}

interface AccountsContextValue {
  tenants: StoredTenant[];
  loading: boolean;
  active: ActiveSelection | null;
  setActive: (selection: ActiveSelection) => void;
  login: (username: string, password: string) => Promise<void>;
  logout: (tenant: string) => Promise<void>;
  refresh: () => Promise<void>;
}

const AccountsContext = createContext<AccountsContextValue | null>(null);

export function AccountsProvider({ children }: { children: React.ReactNode }) {
  const [tenants, setTenants] = useState<StoredTenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<ActiveSelection | null>(null);

  const refresh = useCallback(async () => {
    const loaded = await loadAllTenants();
    setTenants(loaded);
    setActive((current) => {
      if (current) return current;
      const first = loaded[0];
      const firstPupilId = first?.students[0]?.Pupil.Id;
      return first && firstPupilId !== undefined ? { tenant: first.credential.tenant, pupilId: firstPupilId } : null;
    });
  }, []);

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, [refresh]);

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

  const value = useMemo<AccountsContextValue>(
    () => ({ tenants, loading, active, setActive, login, logout, refresh }),
    [tenants, loading, active, login, logout, refresh]
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
