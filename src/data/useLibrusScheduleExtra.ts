import { useQuery } from '@tanstack/react-query';
import { getScheduleExtraAdapted } from '../api/librus/adapters/scheduleExtra';
import { getWeekRange } from '../utils/dates';
import { useLibrusQuery } from './useLibrusQuery';

/** Librus counterpart to useScheduleExtra() - same return shape so schedule-extra/index.tsx needs no changes. */
export function useLibrusScheduleExtra(referenceDate: Date = new Date()) {
  const { activeChild, run } = useLibrusQuery();
  const { dateFrom } = getWeekRange(referenceDate);
  const enabled = Boolean(activeChild);

  const query = useQuery({
    queryKey: ['librusScheduleExtra', activeChild?.child.id, dateFrom],
    queryFn: () => run((token) => getScheduleExtraAdapted(token, dateFrom)),
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
