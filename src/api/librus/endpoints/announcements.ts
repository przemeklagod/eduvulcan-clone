import { librusGet } from '../client';
import type { LibrusAnnouncement } from '../types';

interface SchoolNoticesResponse {
  SchoolNotices: LibrusAnnouncement[];
}

export function getLibrusAnnouncements(accessToken: string): Promise<LibrusAnnouncement[]> {
  return librusGet<SchoolNoticesResponse>(accessToken, '/SchoolNotices').then((r) => r.SchoolNotices);
}
