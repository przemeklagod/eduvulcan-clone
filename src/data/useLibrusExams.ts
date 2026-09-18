import { useQuery } from '@tanstack/react-query';
import { getExamsAdapted } from '../api/librus/adapters/exams';
import { useLibrusQuery } from './useLibrusQuery';

/** Librus counterpart to useExams() - same return shape so exams/index.tsx needs no changes. */
export function useLibrusExams() {
  const { activeChild, run } = useLibrusQuery();
  const enabled = Boolean(activeChild);

  const query = useQuery({
    queryKey: ['librusExams', activeChild?.child.id],
    queryFn: () => run(getExamsAdapted),
    enabled,
  });

  return {
    exams: query.data ?? [],
    isLoading: query.isLoading,
    isRefetching: query.isRefetching,
    error: query.error,
    refetch: query.refetch,
    hasActiveStudent: enabled,
  };
}
