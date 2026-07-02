import { hebeGet } from '../client';
import type { HebeCredential } from '../client';
import { fullSyncQuery } from '../pagination';
import type { PresenceExtra, PresenceMonthStats, PresenceSubjectStats } from '../types/presence';

type DateRangeParams = { pupilId: number; dateFrom: string; dateTo: string };
type PeriodParams = { pupilId: number; periodId: number };

export function getPresenceExtra(credential: HebeCredential, params: DateRangeParams): Promise<PresenceExtra[]> {
  return hebeGet<PresenceExtra[]>(credential, 'mobile/presence/extra/byPupil', fullSyncQuery(params));
}

export function getPresenceMonthStats(credential: HebeCredential, params: PeriodParams): Promise<PresenceMonthStats[]> {
  return hebeGet<PresenceMonthStats[]>(credential, 'mobile/presence/stats/perMonth', params);
}

export function getPresenceSubjectStats(credential: HebeCredential, params: PeriodParams): Promise<PresenceSubjectStats[]> {
  return hebeGet<PresenceSubjectStats[]>(credential, 'mobile/presence/stats/perSubject', params);
}
