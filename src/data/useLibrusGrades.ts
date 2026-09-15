import { useQuery } from '@tanstack/react-query';
import { getGradesAdapted } from '../api/librus/adapters/grades';
import { useLibrusQuery } from './useLibrusQuery';

/**
 * Librus counterpart to useGrades() - same return shape so grades/index.tsx
 * needs no changes. averages/summaries/periods are empty for now (Librus does
 * expose /Grades/Averages, but wiring it up is a follow-up, not blocking the
 * first Librus screen).
 */
export function useLibrusGrades() {
  const { activeChild, run } = useLibrusQuery();
  const enabled = Boolean(activeChild);

  const query = useQuery({
    queryKey: ['librusGrades', activeChild?.child.id],
    queryFn: () => run(getGradesAdapted),
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
