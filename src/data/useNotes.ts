import { useQuery } from '@tanstack/react-query';
import { getNotes } from '../api/hebe/endpoints/notes';
import { useActiveCredential } from '../auth/accountsContext';

export function useNotes() {
  const activeInfo = useActiveCredential();
  const enabled = Boolean(activeInfo);

  const query = useQuery({
    queryKey: ['notes', activeInfo?.credential.tenant, activeInfo?.pupilId],
    queryFn: () => getNotes(activeInfo!.credential, { pupilId: activeInfo!.pupilId }),
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
