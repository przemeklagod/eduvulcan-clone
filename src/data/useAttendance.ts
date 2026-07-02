import { useQuery } from '@tanstack/react-query';
import { getPresenceMonthStats, getPresenceSubjectStats } from '../api/hebe/endpoints/presence';
import { useActiveCredential } from '../auth/accountsContext';

function findCurrentPeriodId(periods: Array<{ Id: number; Current: boolean }>): number | undefined {
  return periods.find((p) => p.Current)?.Id ?? periods[0]?.Id;
}

export function useAttendance() {
  const activeInfo = useActiveCredential();
  const student = activeInfo?.students.find((s) => s.Pupil.Id === activeInfo.pupilId);
  const periodId = student ? findCurrentPeriodId(student.Periods) : undefined;
  const enabled = Boolean(activeInfo && periodId !== undefined);

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

  return {
    monthStats: monthStatsQuery.data ?? [],
    subjectStats: subjectStatsQuery.data ?? [],
    isLoading: monthStatsQuery.isLoading || subjectStatsQuery.isLoading,
    isRefetching: monthStatsQuery.isRefetching || subjectStatsQuery.isRefetching,
    error: monthStatsQuery.error ?? subjectStatsQuery.error,
    refetch: () => Promise.all([monthStatsQuery.refetch(), subjectStatsQuery.refetch()]),
    hasActiveStudent: enabled,
  };
}
