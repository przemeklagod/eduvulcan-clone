import { useQuery } from '@tanstack/react-query';
import { getCompletedLessons } from '../api/hebe/endpoints/lessons';
import { getPresenceMonthStats, getPresenceSubjectStats } from '../api/hebe/endpoints/presence';
import { useActiveCredential } from '../auth/accountsContext';
import { formatDateForApi } from '../utils/dates';

// Inactive/historical enrollments (e.g. a school the pupil no longer attends)
// can come back with Periods: null instead of [] - guard against that.
function findCurrentPeriodId(periods: Array<{ Id: number; Current: boolean }> | null | undefined): number | undefined {
  return periods?.find((p) => p.Current)?.Id ?? periods?.[0]?.Id;
}

export function useAttendance() {
  const activeInfo = useActiveCredential();
  const student = activeInfo?.students.find((s) => s.Pupil.Id === activeInfo.pupilId);
  const periods = student?.Periods ?? [];
  const periodId = findCurrentPeriodId(periods);
  const enabled = Boolean(activeInfo && periodId !== undefined);

  const dateFrom = periods[0]?.StartAt;
  const dateTo = formatDateForApi(new Date());

  const monthStatsQuery = useQuery({
    queryKey: ['presenceMonthStats', activeInfo?.credential.tenant, activeInfo?.pupilId, periodId],
    queryFn: () => getPresenceMonthStats(activeInfo!.credential, { pupilId: activeInfo!.pupilId, periodId: periodId! }),
    enabled,
  });

  const subjectStatsQuery = useQuery({
    queryKey: ['presenceSubjectStats', activeInfo?.credential.tenant, activeInfo?.pupilId, periodId],
    queryFn: () =>
      getPresenceSubjectStats(activeInfo!.credential, { pupilId: activeInfo!.pupilId, periodId: periodId! }),
    enabled,
  });

  // Lessons (not PresenceExtra) carry the LessonClassId that justifyAbsence needs -
  // confirmed against the real Vulcanova client's LessonsService, which builds its
  // "can be justified" list the same way: Absence/Late, not yet justified, and no
  // justification already submitted/pending.
  const lessonsQuery = useQuery({
    queryKey: ['lessons', activeInfo?.credential.tenant, activeInfo?.pupilId, dateFrom, dateTo],
    queryFn: () => getCompletedLessons(activeInfo!.credential, { pupilId: activeInfo!.pupilId, dateFrom: dateFrom!, dateTo }),
    enabled: enabled && Boolean(dateFrom),
  });

  const unexcusedAbsences = (lessonsQuery.data ?? [])
    .filter(
      (l) =>
        l.PresenceType?.Absence &&
        !l.PresenceType.AbsenceJustified &&
        l.JustificationStatus == null &&
        // A few records come back with LessonClassId 0 (seen on days with a
        // schedule anomaly, no Subject either) - not a real justifiable lesson.
        l.LessonClassId
    )
    .sort((a, b) => a.DayAt.localeCompare(b.DayAt) || a.TimeSlot.Position - b.TimeSlot.Position);

  return {
    monthStats: monthStatsQuery.data ?? [],
    subjectStats: subjectStatsQuery.data ?? [],
    unexcusedAbsences,
    isLoading: monthStatsQuery.isLoading || subjectStatsQuery.isLoading,
    isLoadingExtra: lessonsQuery.isLoading,
    isRefetching: monthStatsQuery.isRefetching || subjectStatsQuery.isRefetching || lessonsQuery.isRefetching,
    error: monthStatsQuery.error ?? subjectStatsQuery.error,
    errorExtra: lessonsQuery.error,
    refetch: () => Promise.all([monthStatsQuery.refetch(), subjectStatsQuery.refetch(), lessonsQuery.refetch()]),
    hasActiveStudent: enabled,
  };
}
