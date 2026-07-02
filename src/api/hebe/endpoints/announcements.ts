import { hebeGet } from '../client';
import type { HebeCredential } from '../client';
import { fullSyncQuery } from '../pagination';
import type { Announcement } from '../types/announcement';

export function getAnnouncements(credential: HebeCredential, params: { pupilId: number }): Promise<Announcement[]> {
  return hebeGet<Announcement[]>(credential, 'mobile/announcement/byPupil', fullSyncQuery(params));
}
