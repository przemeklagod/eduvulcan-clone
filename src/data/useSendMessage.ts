import { useMutation, useQueryClient } from '@tanstack/react-query';
import { sendMessage } from '../api/hebe/endpoints/messages';
import type { SendMessageParams } from '../api/hebe/endpoints/messages';
import { useActiveCredential } from '../auth/accountsContext';

export function useSendMessage() {
  const activeInfo = useActiveCredential();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (params: SendMessageParams) => sendMessage(activeInfo!.credential, params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', 'sent', activeInfo?.credential.tenant, activeInfo?.pupilId] });
    },
  });

  return {
    send: mutation.mutateAsync,
    isSending: mutation.isPending,
    error: mutation.error,
    reset: mutation.reset,
  };
}
