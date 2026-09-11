import type { HebeCredential } from '../api/hebe/client';
import type { Account } from '../api/hebe/types/account';
import { deleteSecureJson, getSecureJson, setSecureJson } from './secureJson';

const TENANTS_INDEX_KEY = 'hebe_tenants';
const HIDDEN_CHILDREN_KEY = 'hebe_hidden_children';

function childKey(tenant: string, pupilId: number): string {
  return `${tenant}:${pupilId}`;
}

/** Children hidden from the switcher (top-right badge, default-active selection) - still visible/manageable in Settings. */
export async function getHiddenChildren(): Promise<string[]> {
  return (await getSecureJson<string[]>(HIDDEN_CHILDREN_KEY)) ?? [];
}

export async function setChildHidden(tenant: string, pupilId: number, hidden: boolean): Promise<void> {
  const key = childKey(tenant, pupilId);
  const current = await getHiddenChildren();
  const next = hidden ? [...new Set([...current, key])] : current.filter((k) => k !== key);
  await setSecureJson(HIDDEN_CHILDREN_KEY, next);
}

export interface StoredTenant {
  credential: HebeCredential;
  students: Account[];
}

function credentialKey(tenant: string): string {
  return `hebe_credential_${tenant}`;
}

export async function listRegisteredTenants(): Promise<string[]> {
  return (await getSecureJson<string[]>(TENANTS_INDEX_KEY)) ?? [];
}

export async function saveTenant(tenant: string, credential: HebeCredential, students: Account[]): Promise<void> {
  await setSecureJson<StoredTenant>(credentialKey(tenant), { credential, students });

  const tenants = await listRegisteredTenants();
  if (!tenants.includes(tenant)) {
    await setSecureJson(TENANTS_INDEX_KEY, [...tenants, tenant]);
  }
}

export async function loadTenant(tenant: string): Promise<StoredTenant | null> {
  return getSecureJson<StoredTenant>(credentialKey(tenant));
}

export async function loadAllTenants(): Promise<StoredTenant[]> {
  const tenants = await listRegisteredTenants();
  const loaded = await Promise.all(tenants.map(loadTenant));
  return loaded.filter((t): t is StoredTenant => t !== null);
}

export async function removeTenant(tenant: string): Promise<void> {
  await deleteSecureJson(credentialKey(tenant));
  const tenants = await listRegisteredTenants();
  await setSecureJson(
    TENANTS_INDEX_KEY,
    tenants.filter((t) => t !== tenant)
  );
}
