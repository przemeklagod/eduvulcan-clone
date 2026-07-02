import { useQuery } from '@tanstack/react-query';
import { getDeletedMessages, getReceivedMessages, getSentMessages } from '../api/hebe/endpoints/messages';
import { useActiveCredential } from '../auth/accountsContext';

export type MessageFolder = 'received' | 'sent' | 'deleted';

const FETCHERS = {
  received: getReceivedMessages,
  sent: getSentMessages,
  deleted: getDeletedMessages,
} as const;

export function useMessages(folder: MessageFolder) {
  const activeInfo = useActiveCredential();
  const student = activeInfo?.students.find((s) => s.Pupil.Id === activeInfo.pupilId);
  const box = student?.MessageBox?.GlobalKey;
  const enabled = Boolean(activeInfo && box);

  const query = useQuery({
    queryKey: ['messages', folder, activeInfo?.credential.tenant, activeInfo?.pupilId],
    queryFn: () => FETCHERS[folder](activeInfo!.credential, { box: box!, pupilId: activeInfo!.pupilId }),
    enabled,
  });

  return {
    messages: query.data ?? [],
    isLoading: query.isLoading,
    isRefetching: query.isRefetching,
    error: query.error,
    refetch: query.refetch,
    hasActiveStudent: enabled,
  };
}
