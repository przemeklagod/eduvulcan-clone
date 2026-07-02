import { hebeGet, hebePost } from '../client';
import type { HebeCredential } from '../client';
import { fullSyncQuery } from '../pagination';
import type { PresenceExtra, PresenceMonthStats, PresenceSubjectStats } from '../types/presence';

type DateRangeParams = { pupilId: number; dateFrom: string; dateTo: string };
type PeriodParams = { pupilId: number; periodId: number };

export interface JustifyAbsenceParams {
  /** The specific lesson occurrence to justify - PresenceExtra.IdWeakRef if present, else its own Id. */
  lessonClassId: number;
  pupilId: number;
  /** Pupil.LoginId (distinct from Pupil.Id) - required by the older sibling endpoint this is ported from. */
  loginId: number;
  reason: string;
}

/**
 * EXPERIMENTAL - `mobile/presence/justification` is confirmed to exist as a real
 * route (a deliberately-incomplete probe got a proper Hebe envelope error, not a
 * 404), but the exact field shape is a best-effort reconstruction from an analogous
 * (older, differently-pathed) C# client (dolczykk/Vulcanova.Uonet's
 * `mobile/presence/justification/lesson` JustifyLessonRequest: Reason/LessonClassId/
 * PupilId/LoginId), adapted to drop the now-presumably-merged `/lesson` path segment.
 * Ported blind - not live-tested, to avoid writing a bogus justification onto a real
 * child's official school record. The first real call IS the live test.
 */
export function justifyAbsence(credential: HebeCredential, params: JustifyAbsenceParams): Promise<void> {
  return hebePost(credential, 'mobile/presence/justification', {
    Reason: params.reason,
    LessonClassId: params.lessonClassId,
    PupilId: params.pupilId,
    LoginId: params.loginId,
  });
}

export function getPresenceExtra(credential: HebeCredential, params: DateRangeParams): Promise<PresenceExtra[]> {
  return hebeGet<PresenceExtra[]>(credential, 'mobile/presence/extra/byPupil', fullSyncQuery(params));
}

export function getPresenceMonthStats(credential: HebeCredential, params: PeriodParams): Promise<PresenceMonthStats[]> {
  return hebeGet<PresenceMonthStats[]>(credential, 'mobile/presence/stats/perMonth', params);
}

export function getPresenceSubjectStats(credential: HebeCredential, params: PeriodParams): Promise<PresenceSubjectStats[]> {
  return hebeGet<PresenceSubjectStats[]>(credential, 'mobile/presence/stats/perSubject', params);
}
