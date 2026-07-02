import { useQuery } from '@tanstack/react-query';
import { getScheduleExtra } from '../api/hebe/endpoints/schedule';
import { useActiveCredential } from '../auth/accountsContext';
import { formatDateForApi } from '../utils/dates';

export function useScheduleExtra() {
  const activeInfo = useActiveCredential();
  const student = activeInfo?.students.find((s) => s.Pupil.Id === activeInfo.pupilId);
  const periods = student?.Periods ?? [];
  const dateFrom = periods[0]?.StartAt;
  const dateTo = periods[periods.length - 1]?.EndAt ?? formatDateForApi(new Date());
  const enabled = Boolean(activeInfo && dateFrom);

  const query = useQuery({
    queryKey: ['scheduleExtra', activeInfo?.credential.tenant, activeInfo?.pupilId, dateFrom, dateTo],
    queryFn: () => getScheduleExtra(activeInfo!.credential, { pupilId: activeInfo!.pupilId, dateFrom: dateFrom!, dateTo }),
    enabled,
  });

  return {
    scheduleExtra: query.data ?? [],
    isLoading: query.isLoading,
    isRefetching: query.isRefetching,
    error: query.error,
    refetch: query.refetch,
    hasActiveStudent: enabled,
  };
}
