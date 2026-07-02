import { useQuery } from '@tanstack/react-query';
import { getExams } from '../api/hebe/endpoints/exams';
import { useActiveCredential } from '../auth/accountsContext';
import { formatDateForApi } from '../utils/dates';

export function useExams() {
  const activeInfo = useActiveCredential();
  const student = activeInfo?.students.find((s) => s.Pupil.Id === activeInfo.pupilId);
  const periods = student?.Periods ?? [];
  const dateFrom = periods[0]?.StartAt;
  const dateTo = periods[periods.length - 1]?.EndAt ?? formatDateForApi(new Date());
  const enabled = Boolean(activeInfo && dateFrom);

  const query = useQuery({
    queryKey: ['exams', activeInfo?.credential.tenant, activeInfo?.pupilId, dateFrom, dateTo],
    queryFn: () => getExams(activeInfo!.credential, { pupilId: activeInfo!.pupilId, dateFrom: dateFrom!, dateTo }),
    enabled,
  });

  return {
    exams: query.data ?? [],
    isLoading: query.isLoading,
    isRefetching: query.isRefetching,
    error: query.error,
    refetch: query.refetch,
    hasActiveStudent: enabled,
  };
}
