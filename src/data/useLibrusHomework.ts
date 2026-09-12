import { useQuery } from '@tanstack/react-query';
import { getHomeworkAdapted } from '../api/librus/adapters/homework';
import { useActiveLibrusChild } from '../auth/accountsContext';

/** Librus counterpart to useHomework() - same return shape so homework/index.tsx needs no changes. */
export function useLibrusHomework() {
  const activeChild = useActiveLibrusChild();
  const enabled = Boolean(activeChild);

  const query = useQuery({
    queryKey: ['librusHomework', activeChild?.child.id],
    queryFn: () => getHomeworkAdapted(activeChild!.child.accessToken),
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
