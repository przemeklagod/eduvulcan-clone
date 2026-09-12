import type { HebeCredential } from '../api/hebe/client';
import type { Account } from '../api/hebe/types/account';
import type { LibrusChildAccount } from '../api/librus/types';
import { deleteSecureJson, getSecureJson, setSecureJson } from './secureJson';

const TENANTS_INDEX_KEY = 'hebe_tenants';
const HIDDEN_CHILDREN_KEY = 'hebe_hidden_children';
const LIBRUS_ACCOUNTS_INDEX_KEY = 'librus_accounts';

export function librusChildKey(childId: number): string {
  return `librus:${childId}`;
}

/** Children hidden from the switcher (top-right badge, default-active selection) - still visible/manageable in Settings. */
export async function getHiddenChildren(): Promise<string[]> {
  return (await getSecureJson<string[]>(HIDDEN_CHILDREN_KEY)) ?? [];
}

export async function setChildHidden(key: string, hidden: boolean): Promise<void> {
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

/**
 * A Librus parent-portal account. Unlike Vulcan's RSA device cert (which
 * never expires), Librus's per-child bearer tokens expire and refreshing one
 * requires a portal re-login - so the portal password is persisted here (in
 * the same secure storage as Vulcan credentials) rather than discarded after
 * the initial login.
 */
export interface StoredLibrusAccount {
  portalEmail: string;
  portalPassword: string;
  children: LibrusChildAccount[];
}

function librusAccountKey(portalEmail: string): string {
  return `librus_account_${portalEmail}`;
}

export async function listLibrusAccountEmails(): Promise<string[]> {
  return (await getSecureJson<string[]>(LIBRUS_ACCOUNTS_INDEX_KEY)) ?? [];
}

export async function saveLibrusAccount(
  portalEmail: string,
  portalPassword: string,
  children: LibrusChildAccount[]
): Promise<void> {
  await setSecureJson<StoredLibrusAccount>(librusAccountKey(portalEmail), { portalEmail, portalPassword, children });

  const emails = await listLibrusAccountEmails();
  if (!emails.includes(portalEmail)) {
    await setSecureJson(LIBRUS_ACCOUNTS_INDEX_KEY, [...emails, portalEmail]);
  }
}

export async function loadLibrusAccount(portalEmail: string): Promise<StoredLibrusAccount | null> {
  return getSecureJson<StoredLibrusAccount>(librusAccountKey(portalEmail));
}

export async function loadAllLibrusAccounts(): Promise<StoredLibrusAccount[]> {
  const emails = await listLibrusAccountEmails();
  const loaded = await Promise.all(emails.map(loadLibrusAccount));
  return loaded.filter((a): a is StoredLibrusAccount => a !== null);
}

export async function removeLibrusAccount(portalEmail: string): Promise<void> {
  await deleteSecureJson(librusAccountKey(portalEmail));
  const emails = await listLibrusAccountEmails();
  await setSecureJson(
    LIBRUS_ACCOUNTS_INDEX_KEY,
    emails.filter((e) => e !== portalEmail)
  );
}
