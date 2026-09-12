import { useQuery } from '@tanstack/react-query';
import { getSchedule } from '../api/hebe/endpoints/schedule';
import { useAccounts, useActiveCredential } from '../auth/accountsContext';
import { getWeekRange } from '../utils/dates';
import { useLibrusSchedule } from './useLibrusSchedule';

function useVulcanSchedule(referenceDate: Date) {
  const activeInfo = useActiveCredential();
  const { dateFrom, dateTo } = getWeekRange(referenceDate);
  const enabled = Boolean(activeInfo);

  const query = useQuery({
    queryKey: ['schedule', activeInfo?.credential.tenant, activeInfo?.pupilId, dateFrom, dateTo],
    queryFn: () => getSchedule(activeInfo!.credential, { pupilId: activeInfo!.pupilId, dateFrom, dateTo }),
    enabled,
  });

  return {
    schedule: query.data ?? [],
    isLoading: query.isLoading,
    isRefetching: query.isRefetching,
    error: query.error,
    refetch: query.refetch,
    hasActiveStudent: enabled,
  };
}

export function useSchedule(referenceDate: Date = new Date()) {
  const { active } = useAccounts();
  const vulcanResult = useVulcanSchedule(referenceDate);
  const librusResult = useLibrusSchedule(referenceDate);

  return active?.provider === 'librus' ? librusResult : vulcanResult;
}
