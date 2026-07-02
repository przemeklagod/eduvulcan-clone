import { useMutation, useQueryClient } from '@tanstack/react-query';
import { justifyAbsence } from '../api/hebe/endpoints/presence';
import type { JustifyAbsenceParams } from '../api/hebe/endpoints/presence';
import { useActiveCredential } from '../auth/accountsContext';

export function useJustifyAbsence() {
  const activeInfo = useActiveCredential();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (params: JustifyAbsenceParams) => justifyAbsence(activeInfo!.credential, params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['presenceExtra', activeInfo?.credential.tenant, activeInfo?.pupilId] });
      queryClient.invalidateQueries({ queryKey: ['presenceMonthStats', activeInfo?.credential.tenant, activeInfo?.pupilId] });
      queryClient.invalidateQueries({ queryKey: ['presenceSubjectStats', activeInfo?.credential.tenant, activeInfo?.pupilId] });
    },
  });

  return {
    justify: mutation.mutateAsync,
    isSubmitting: mutation.isPending,
    error: mutation.error,
    reset: mutation.reset,
  };
}
