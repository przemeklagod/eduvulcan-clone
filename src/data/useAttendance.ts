import { useQuery } from '@tanstack/react-query';
import { getPresenceExtra, getPresenceMonthStats, getPresenceSubjectStats } from '../api/hebe/endpoints/presence';
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

  const extraQuery = useQuery({
    queryKey: ['presenceExtra', activeInfo?.credential.tenant, activeInfo?.pupilId, dateFrom, dateTo],
    queryFn: () => getPresenceExtra(activeInfo!.credential, { pupilId: activeInfo!.pupilId, dateFrom: dateFrom!, dateTo }),
    enabled: enabled && Boolean(dateFrom),
  });

  const unexcusedAbsences = (extraQuery.data ?? [])
    .filter((p) => p.PresenceType?.Absence && !p.PresenceType?.AbsenceJustified)
    .sort((a, b) => a.DayAt.localeCompare(b.DayAt) || a.TimeSlot.Position - b.TimeSlot.Position);

  return {
    monthStats: monthStatsQuery.data ?? [],
    subjectStats: subjectStatsQuery.data ?? [],
    unexcusedAbsences,
    isLoading: monthStatsQuery.isLoading || subjectStatsQuery.isLoading,
    isLoadingExtra: extraQuery.isLoading,
    isRefetching: monthStatsQuery.isRefetching || subjectStatsQuery.isRefetching || extraQuery.isRefetching,
    error: monthStatsQuery.error ?? subjectStatsQuery.error,
    errorExtra: extraQuery.error,
    refetch: () => Promise.all([monthStatsQuery.refetch(), subjectStatsQuery.refetch(), extraQuery.refetch()]),
    hasActiveStudent: enabled,
  };
}
