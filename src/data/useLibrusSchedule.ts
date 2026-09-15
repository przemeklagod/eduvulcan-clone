import { useQuery } from '@tanstack/react-query';
import { getScheduleAdapted } from '../api/librus/adapters/schedule';
import { getWeekRange } from '../utils/dates';
import { useLibrusQuery } from './useLibrusQuery';

/** Librus counterpart to useSchedule() - same return shape so schedule/index.tsx needs no changes. */
export function useLibrusSchedule(referenceDate: Date = new Date()) {
  const { activeChild, run } = useLibrusQuery();
  const { dateFrom } = getWeekRange(referenceDate);
  const enabled = Boolean(activeChild);

  const query = useQuery({
    queryKey: ['librusSchedule', activeChild?.child.id, dateFrom],
    queryFn: () => run((token) => getScheduleAdapted(token, dateFrom)),
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
