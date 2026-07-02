import { hebeGet } from '../client';
import type { HebeCredential } from '../client';
import { fullSyncQuery } from '../pagination';
import type { Exam } from '../types/exam';

type DateRangeParams = { pupilId: number; dateFrom: string; dateTo: string };

export function getExams(credential: HebeCredential, params: DateRangeParams): Promise<Exam[]> {
  return hebeGet<Exam[]>(credential, 'mobile/exam/byPupil', fullSyncQuery(params));
}
