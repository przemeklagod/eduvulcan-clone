import { hebeGet } from '../client';
import type { HebeCredential } from '../client';
import { fullSyncQuery } from '../pagination';
import type { Schedule, ScheduleExtra } from '../types/schedule';

type DateRangeParams = { pupilId: number; dateFrom: string; dateTo: string };

export function getSchedule(credential: HebeCredential, params: DateRangeParams): Promise<Schedule[]> {
  return hebeGet<Schedule[]>(credential, 'mobile/schedule/withchanges/byPupil', fullSyncQuery(params));
}

export function getScheduleExtra(credential: HebeCredential, params: DateRangeParams): Promise<ScheduleExtra[]> {
  return hebeGet<ScheduleExtra[]>(credential, 'mobile/schedule/extra/withchanges/byPupil', fullSyncQuery(params));
}
