import { useQuery } from '@tanstack/react-query';
import { getGradeAverages, getGrades } from '../api/hebe/endpoints/grades';
import { useActiveCredential } from '../auth/accountsContext';

function findCurrentPeriodId(periods: Array<{ Id: number; Current: boolean }>): number | undefined {
  return periods.find((p) => p.Current)?.Id ?? periods[0]?.Id;
}

export function useGrades() {
  const activeInfo = useActiveCredential();
  const student = activeInfo?.students.find((s) => s.Pupil.Id === activeInfo.pupilId);
  const periodId = student ? findCurrentPeriodId(student.Periods) : undefined;
  const unitId = student?.Unit.Id;
  const enabled = Boolean(activeInfo && student && periodId !== undefined && unitId !== undefined);

  const params = enabled ? { unitId: unitId!, pupilId: activeInfo!.pupilId, periodId: periodId! } : null;

  const gradesQuery = useQuery({
    queryKey: ['grades', activeInfo?.credential.tenant, activeInfo?.pupilId, periodId],
    queryFn: () => getGrades(activeInfo!.credential, params!),
    enabled,
  });

  const averagesQuery = useQuery({
    queryKey: ['gradeAverages', activeInfo?.credential.tenant, activeInfo?.pupilId, periodId],
    queryFn: () => getGradeAverages(activeInfo!.credential, params!),
    enabled,
  });

  return {
    grades: gradesQuery.data ?? [],
    averages: averagesQuery.data ?? [],
    isLoading: gradesQuery.isLoading || averagesQuery.isLoading,
    error: gradesQuery.error ?? averagesQuery.error,
    refetch: () => Promise.all([gradesQuery.refetch(), averagesQuery.refetch()]),
    isRefetching: gradesQuery.isRefetching || averagesQuery.isRefetching,
    hasActiveStudent: enabled,
  };
}
