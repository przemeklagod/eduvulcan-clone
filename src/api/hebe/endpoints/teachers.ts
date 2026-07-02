import { hebeGet } from '../client';
import type { HebeCredential } from '../client';
import { fullSyncQuery } from '../pagination';
import type { Address } from '../types/common';
import type { Teacher } from '../types/teacher';

export function getTeachers(credential: HebeCredential, params: { periodId: number; pupilId: number }): Promise<Teacher[]> {
  return hebeGet<Teacher[]>(credential, 'mobile/teacher/byPeriod', fullSyncQuery(params));
}

/** Recipient directory for a message box - used to resolve sender/recipient names. */
export function getAddressBook(credential: HebeCredential, box: string): Promise<Address[]> {
  return hebeGet<Address[]>(credential, 'mobile/addressbook', { box });
}
