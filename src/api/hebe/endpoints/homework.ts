import { hebeGet } from '../client';
import type { HebeCredential } from '../client';
import { fullSyncQuery } from '../pagination';
import type { Homework } from '../types/homework';

type DateRangeParams = { pupilId: number; dateFrom: string; dateTo: string };

export function getHomework(credential: HebeCredential, params: DateRangeParams): Promise<Homework[]> {
  return hebeGet<Homework[]>(credential, 'mobile/homework/byPupil', fullSyncQuery(params));
}
