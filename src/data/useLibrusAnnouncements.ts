import { useQuery } from '@tanstack/react-query';
import { getAnnouncementsAdapted } from '../api/librus/adapters/announcements';
import { useLibrusQuery } from './useLibrusQuery';

/** Librus counterpart to useAnnouncements() - same return shape so announcements/index.tsx needs no changes. */
export function useLibrusAnnouncements() {
  const { activeChild, run } = useLibrusQuery();
  const enabled = Boolean(activeChild);

  const query = useQuery({
    queryKey: ['librusAnnouncements', activeChild?.child.id],
    queryFn: () => run(getAnnouncementsAdapted),
    enabled,
  });

  return {
    announcements: query.data ?? [],
    isLoading: query.isLoading,
    isRefetching: query.isRefetching,
    error: query.error,
    refetch: query.refetch,
    hasActiveStudent: enabled,
  };
}
