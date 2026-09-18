import { useQuery } from '@tanstack/react-query';
import { getNotes } from '../api/hebe/endpoints/notes';
import { useAccounts, useActiveCredential } from '../auth/accountsContext';
import { useLibrusNotes } from './useLibrusNotes';

function useVulcanNotes() {
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

export function useNotes() {
  const { active } = useAccounts();
  const vulcanResult = useVulcanNotes();
  const librusResult = useLibrusNotes();

  return active?.provider === 'librus' ? librusResult : vulcanResult;
}
