import { hebeGet } from '../client';
import type { HebeCredential } from '../client';
import { fullSyncQuery } from '../pagination';
import type { Announcement } from '../types/announcement';

type AnnouncementParams = { unitId: number; pupilId: number; view?: number };

/** `unitId` and `view` are required by Hebe - omitting either 404s the endpoint. */
export function getAnnouncements(credential: HebeCredential, params: AnnouncementParams): Promise<Announcement[]> {
  return hebeGet<Announcement[]>(credential, 'mobile/announcement/byPupil', fullSyncQuery({ view: 6, ...params }));
}
