import { useQuery } from '@tanstack/react-query';
import { getGradeAverages, getGradeSummary, getGrades } from '../api/hebe/endpoints/grades';
import type { GradeSummary } from '../api/hebe/types/grade';
import { useActiveCredential } from '../auth/accountsContext';

function findCurrentPeriodId(periods: Array<{ Id: number; Current: boolean }>): number | undefined {
  return periods.find((p) => p.Current)?.Id ?? periods[0]?.Id;
}

export function useGrades() {
  const activeInfo = useActiveCredential();
  const student = activeInfo?.students.find((s) => s.Pupil.Id === activeInfo.pupilId);
  const periodId = student ? findCurrentPeriodId(student.Periods) : undefined;
  const unitId = student?.Unit.Id;
  const periods = student?.Periods ?? [];
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

  // Semester/final ("proponowana"/"ustalona") grades live in a separate summary
  // endpoint, one call per period - not just the current one, so both semester
  // and end-of-year entries are available even mid-year.
  const summaryQuery = useQuery({
    queryKey: ['gradeSummary', activeInfo?.credential.tenant, activeInfo?.pupilId, periods.map((p) => p.Id).join(',')],
    queryFn: async (): Promise<GradeSummary[]> => {
      const perPeriod = await Promise.all(
        periods.map((p) => getGradeSummary(activeInfo!.credential, { unitId: unitId!, pupilId: activeInfo!.pupilId, periodId: p.Id }))
      );
      return perPeriod.flat();
    },
    enabled: enabled && periods.length > 0,
  });

  return {
    grades: gradesQuery.data ?? [],
    averages: averagesQuery.data ?? [],
    summaries: summaryQuery.data ?? [],
    periods,
    isLoading: gradesQuery.isLoading || averagesQuery.isLoading,
    error: gradesQuery.error ?? averagesQuery.error,
    refetch: () => Promise.all([gradesQuery.refetch(), averagesQuery.refetch(), summaryQuery.refetch()]),
    isRefetching: gradesQuery.isRefetching || averagesQuery.isRefetching,
    hasActiveStudent: enabled,
  };
}
