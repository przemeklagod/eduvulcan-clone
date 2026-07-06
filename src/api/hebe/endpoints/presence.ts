import { hebeGet, hebePost } from '../client';
import type { HebeCredential } from '../client';
import { fullSyncQuery } from '../pagination';
import type { PresenceExtra, PresenceMonthStats, PresenceSubjectStats } from '../types/presence';

type DateRangeParams = { pupilId: number; dateFrom: string; dateTo: string };
type PeriodParams = { pupilId: number; periodId: number };

export interface JustifyAbsenceParams {
  /** Lesson.LessonClassId - from a `mobile/lesson/byPupil` record, NOT a PresenceExtra id. */
  lessonClassId: number;
  pupilId: number;
  /** Pupil.LoginId (distinct from Pupil.Id). */
  loginId: number;
  reason: string;
}

/**
 * Confirmed against dolczykk/Vulcanova - a real, shipped Xamarin Vulcan client
 * (not just an API library) whose LessonsService.SubmitAbsenceJustification does
 * exactly this: POST to `mobile/presence/justification/lesson` (the "/lesson"
 * suffix is real, not legacy - an earlier guess that the modern API dropped it,
 * matching mobile/messages, was wrong and is what caused a NullReferenceException)
 * with body `{Reason, LessonClassId, PupilId, LoginId}`, where LessonClassId comes
 * from a Lesson record's own LessonClassId field (mobile/lesson/byPupil) - not
 * from PresenceExtra, which has no such field at all.
 */
export function justifyAbsence(credential: HebeCredential, params: JustifyAbsenceParams): Promise<void> {
  return hebePost(credential, 'mobile/presence/justification/lesson', {
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
