import { useQuery } from '@tanstack/react-query';
import { getNotesAdapted } from '../api/librus/adapters/notes';
import { useLibrusQuery } from './useLibrusQuery';

/** Librus counterpart to useNotes() - same return shape so notes/index.tsx needs no changes. */
export function useLibrusNotes() {
  const { activeChild, run } = useLibrusQuery();
  const enabled = Boolean(activeChild);

  const query = useQuery({
    queryKey: ['librusNotes', activeChild?.child.id],
    queryFn: () => run(getNotesAdapted),
    enabled,
  });

  return {
    notes: query.data ?? [],
    isLoading: query.isLoading,
    isRefetching: query.isRefetching,
    error: query.error,
    refetch: query.refetch,
    hasActiveStudent: enabled,
  };
}
