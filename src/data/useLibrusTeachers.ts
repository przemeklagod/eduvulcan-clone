import { useQuery } from '@tanstack/react-query';
import { getTeachersAdapted } from '../api/librus/adapters/teachers';
import { getWeekRange } from '../utils/dates';
import { useLibrusQuery } from './useLibrusQuery';

/** Librus counterpart to useTeachers() - same return shape so teachers/index.tsx needs no changes. */
export function useLibrusTeachers() {
  const { activeChild, run } = useLibrusQuery();
  const { dateFrom } = getWeekRange(new Date());
  const enabled = Boolean(activeChild);

  const query = useQuery({
    queryKey: ['librusTeachers', activeChild?.child.id, dateFrom],
    queryFn: () => run((token) => getTeachersAdapted(token, dateFrom)),
    enabled,
  });

  return {
    teachers: query.data ?? [],
    isLoading: query.isLoading,
    isRefetching: query.isRefetching,
    error: query.error,
    refetch: query.refetch,
    hasActiveStudent: enabled,
  };
}
