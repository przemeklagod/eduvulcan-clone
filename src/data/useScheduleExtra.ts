import { useQuery } from '@tanstack/react-query';
import { getScheduleExtra } from '../api/hebe/endpoints/schedule';
import { useAccounts, useActiveCredential } from '../auth/accountsContext';
import { getWeekRange } from '../utils/dates';
import { useLibrusScheduleExtra } from './useLibrusScheduleExtra';

function useVulcanScheduleExtra(referenceDate: Date) {
  const activeInfo = useActiveCredential();
  const { dateFrom, dateTo } = getWeekRange(referenceDate);
  const enabled = Boolean(activeInfo);

  const query = useQuery({
    queryKey: ['scheduleExtra', activeInfo?.credential.tenant, activeInfo?.pupilId, dateFrom, dateTo],
    queryFn: () => getScheduleExtra(activeInfo!.credential, { pupilId: activeInfo!.pupilId, dateFrom, dateTo }),
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

export function useScheduleExtra(referenceDate: Date = new Date()) {
  const { active } = useAccounts();
  const vulcanResult = useVulcanScheduleExtra(referenceDate);
  const librusResult = useLibrusScheduleExtra(referenceDate);

  return active?.provider === 'librus' ? librusResult : vulcanResult;
}
