import { useQuery } from '@tanstack/react-query';
import { getMessagesAdapted } from '../api/librus/adapters/messages';
import type { MessageFolder } from './useMessages';
import { useLibrusQuery } from './useLibrusQuery';

/**
 * Librus counterpart to useMessages() - same return shape so messages/index.tsx
 * needs no changes. Unlike Vulcan (one endpoint per folder), one Librus fetch
 * covers all three folders at once, so switching tabs is instant with no
 * extra network round-trip.
 */
export function useLibrusMessages(folder: MessageFolder) {
  const { activeChild, run } = useLibrusQuery();
  const enabled = Boolean(activeChild);

  const query = useQuery({
    queryKey: ['librusMessages', activeChild?.child.id],
    queryFn: () => run(getMessagesAdapted),
    enabled,
  });

  return {
    messages: query.data?.[folder] ?? [],
    isLoading: query.isLoading,
    isRefetching: query.isRefetching,
    error: query.error,
    refetch: query.refetch,
    hasActiveStudent: enabled,
  };
}
