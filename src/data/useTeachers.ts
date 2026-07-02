import { useQuery } from '@tanstack/react-query';
import { getTeachers } from '../api/hebe/endpoints/teachers';
import { useActiveCredential } from '../auth/accountsContext';

function findCurrentPeriodId(periods: Array<{ Id: number; Current: boolean }> | null | undefined): number | undefined {
  return periods?.find((p) => p.Current)?.Id ?? periods?.[0]?.Id;
}

export function useTeachers() {
  const activeInfo = useActiveCredential();
  const student = activeInfo?.students.find((s) => s.Pupil.Id === activeInfo.pupilId);
  const periodId = findCurrentPeriodId(student?.Periods);
  const enabled = Boolean(activeInfo && periodId !== undefined);

  const query = useQuery({
    queryKey: ['teachers', activeInfo?.credential.tenant, activeInfo?.pupilId, periodId],
    queryFn: () => getTeachers(activeInfo!.credential, { periodId: periodId!, pupilId: activeInfo!.pupilId }),
    enabled,
  });

  return {
    teachers: query.data ?? [],
    isLoading: query.isLoading,
    isRefetching: query.isRefetching,
    error: query.error,
    refetch: query.refetch,
    hasActiveStudent: enabled,
  };
}
