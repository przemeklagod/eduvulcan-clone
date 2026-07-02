import { hebeGet } from '../client';
import type { HebeCredential } from '../client';
import { fullSyncQuery } from '../pagination';
import type { Grade, GradeAverage, GradeSummary } from '../types/grade';

type PupilPeriodParams = {
  unitId: number;
  pupilId: number;
  periodId: number;
};

export function getGrades(credential: HebeCredential, params: PupilPeriodParams): Promise<Grade[]> {
  return hebeGet<Grade[]>(credential, 'mobile/grade/byPupil', fullSyncQuery(params));
}

export function getGradeAverages(credential: HebeCredential, params: PupilPeriodParams): Promise<GradeAverage[]> {
  return hebeGet<GradeAverage[]>(credential, 'mobile/grade/average/byPupil', fullSyncQuery({ ...params, scope: 'auto' }));
}

export function getGradeSummary(credential: HebeCredential, params: PupilPeriodParams): Promise<GradeSummary[]> {
  return hebeGet<GradeSummary[]>(credential, 'mobile/grade/summary/byPupil', fullSyncQuery(params));
}
