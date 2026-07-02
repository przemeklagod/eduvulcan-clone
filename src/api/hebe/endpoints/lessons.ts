import { hebeGet } from '../client';
import type { HebeCredential } from '../client';
import { fullSyncQuery } from '../pagination';
import type { Lesson } from '../types/lesson';

type DateRangeParams = { pupilId: number; dateFrom: string; dateTo: string };

export function getCompletedLessons(credential: HebeCredential, params: DateRangeParams): Promise<Lesson[]> {
  return hebeGet<Lesson[]>(credential, 'mobile/lesson/byPupil', fullSyncQuery(params));
}

export function getPlannedLessons(credential: HebeCredential, params: DateRangeParams): Promise<Lesson[]> {
  return hebeGet<Lesson[]>(credential, 'mobile/lesson/planned/byPupil', fullSyncQuery(params));
}
