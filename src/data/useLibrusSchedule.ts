import { useQuery } from '@tanstack/react-query';
import { getScheduleAdapted } from '../api/librus/adapters/schedule';
import { useActiveLibrusChild } from '../auth/accountsContext';
import { getWeekRange } from '../utils/dates';

/** Librus counterpart to useSchedule() - same return shape so schedule/index.tsx needs no changes. */
export function useLibrusSchedule(referenceDate: Date = new Date()) {
  const activeChild = useActiveLibrusChild();
  const { dateFrom } = getWeekRange(referenceDate);
  const enabled = Boolean(activeChild);

  const query = useQuery({
    queryKey: ['librusSchedule', activeChild?.child.id, dateFrom],
    queryFn: () => getScheduleAdapted(activeChild!.child.accessToken, dateFrom),
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
