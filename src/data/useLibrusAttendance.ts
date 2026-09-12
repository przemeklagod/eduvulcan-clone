import { useQuery } from '@tanstack/react-query';
import { getAttendanceAdapted } from '../api/librus/adapters/attendance';
import { useActiveLibrusChild } from '../auth/accountsContext';

/** Librus counterpart to useAttendance() - same return shape so attendance/index.tsx needs no changes. */
export function useLibrusAttendance() {
  const activeChild = useActiveLibrusChild();
  const enabled = Boolean(activeChild);

  const query = useQuery({
    queryKey: ['librusAttendance', activeChild?.child.id],
    queryFn: () => getAttendanceAdapted(activeChild!.child.accessToken),
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
