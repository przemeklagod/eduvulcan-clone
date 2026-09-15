import { useQuery } from '@tanstack/react-query';
import { getAttendanceAdapted } from '../api/librus/adapters/attendance';
import { useLibrusQuery } from './useLibrusQuery';

/** Librus counterpart to useAttendance() - same return shape so attendance/index.tsx needs no changes. */
export function useLibrusAttendance() {
  const { activeChild, run } = useLibrusQuery();
  const enabled = Boolean(activeChild);

  const query = useQuery({
    queryKey: ['librusAttendance', activeChild?.child.id],
    queryFn: () => run(getAttendanceAdapted),
    enabled,
  });

  return {
    monthStats: query.data?.monthStats ?? [],
    subjectStats: query.data?.subjectStats ?? [],
    unexcusedAbsences: query.data?.unexcusedAbsences ?? [],
    isLoading: query.isLoading,
    isLoadingExtra: query.isLoading,
    isRefetching: query.isRefetching,
    error: query.error,
    errorExtra: query.error,
    refetch: query.refetch,
    hasActiveStudent: enabled,
  };
}
