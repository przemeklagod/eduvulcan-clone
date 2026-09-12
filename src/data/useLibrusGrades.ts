import { useQuery } from '@tanstack/react-query';
import { getGradesAdapted } from '../api/librus/adapters/grades';
import { useActiveLibrusChild } from '../auth/accountsContext';

/**
 * Librus counterpart to useGrades() - same return shape so grades/index.tsx
 * needs no changes. averages/summaries/periods are empty for now (Librus does
 * expose /Grades/Averages, but wiring it up is a follow-up, not blocking the
 * first Librus screen).
 */
export function useLibrusGrades() {
  const activeChild = useActiveLibrusChild();
  const enabled = Boolean(activeChild);

  const query = useQuery({
    queryKey: ['librusGrades', activeChild?.child.id],
    queryFn: () => getGradesAdapted(activeChild!.child.accessToken),
    enabled,
  });

  return {
    grades: query.data ?? [],
    averages: [],
    summaries: [],
    periods: [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    isRefetching: query.isRefetching,
    hasActiveStudent: enabled,
  };
}
