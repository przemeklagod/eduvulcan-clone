import { useQuery } from '@tanstack/react-query';
import { getInboxMessagesAdapted } from '../api/librus/adapters/messages';
import type { MessageFolder } from './useMessages';
import { useLibrusQuery } from './useLibrusQuery';

/**
 * Librus counterpart to useMessages() - same return shape so messages/index.tsx
 * needs no data-shape changes. Only 'received' has real data: Librus has no
 * sent/deleted folder API (inbox-only), so other folders return empty.
 */
export function useLibrusMessages(folder: MessageFolder) {
  const { activeChild, run } = useLibrusQuery();
  const enabled = Boolean(activeChild) && folder === 'received';

  const query = useQuery({
    queryKey: ['librusMessages', activeChild?.child.id],
    queryFn: () => run(getInboxMessagesAdapted),
    enabled,
  });

  return {
    messages: folder === 'received' ? query.data ?? [] : [],
    isLoading: query.isLoading,
    isRefetching: query.isRefetching,
    error: query.error,
    refetch: query.refetch,
    hasActiveStudent: Boolean(activeChild),
  };
}
