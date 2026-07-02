import { useQuery } from '@tanstack/react-query';
import { getHomework } from '../api/hebe/endpoints/homework';
import { useActiveCredential } from '../auth/accountsContext';
import { formatDateForApi } from '../utils/dates';

export function useHomework() {
  const activeInfo = useActiveCredential();
  const student = activeInfo?.students.find((s) => s.Pupil.Id === activeInfo.pupilId);
  const periods = student?.Periods ?? [];
  const dateFrom = periods[0]?.StartAt;
  const dateTo = periods[periods.length - 1]?.EndAt ?? formatDateForApi(new Date());
  const enabled = Boolean(activeInfo && dateFrom);

  const query = useQuery({
    queryKey: ['homework', activeInfo?.credential.tenant, activeInfo?.pupilId, dateFrom, dateTo],
    queryFn: () => getHomework(activeInfo!.credential, { pupilId: activeInfo!.pupilId, dateFrom: dateFrom!, dateTo }),
    enabled,
  });

  return {
    homework: query.data ?? [],
    isLoading: query.isLoading,
    isRefetching: query.isRefetching,
    error: query.error,
    refetch: query.refetch,
    hasActiveStudent: enabled,
  };
}
