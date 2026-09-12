import { useQuery } from '@tanstack/react-query';
import { getDeletedMessages, getReceivedMessages, getSentMessages } from '../api/hebe/endpoints/messages';
import { useAccounts, useActiveCredential } from '../auth/accountsContext';
import { useLibrusMessages } from './useLibrusMessages';

export type MessageFolder = 'received' | 'sent' | 'deleted';

const FETCHERS = {
  received: getReceivedMessages,
  sent: getSentMessages,
  deleted: getDeletedMessages,
} as const;

function useVulcanMessages(folder: MessageFolder) {
  const activeInfo = useActiveCredential();
  const student = activeInfo?.students.find((s) => s.Pupil.Id === activeInfo.pupilId);
  const box = student?.MessageBox?.GlobalKey;
  const enabled = Boolean(activeInfo && box);

  const query = useQuery({
    queryKey: ['messages', folder, activeInfo?.credential.tenant, activeInfo?.pupilId],
    queryFn: () => FETCHERS[folder](activeInfo!.credential, { box: box!, pupilId: activeInfo!.pupilId }),
    enabled,
  });

  const messages = [...(query.data ?? [])].sort((a, b) => b.SentAt.localeCompare(a.SentAt));

  return {
    messages,
    isLoading: query.isLoading,
    isRefetching: query.isRefetching,
    error: query.error,
    refetch: query.refetch,
    hasActiveStudent: enabled,
  };
}

export function useMessages(folder: MessageFolder) {
  const { active } = useAccounts();
  const vulcanResult = useVulcanMessages(folder);
  const librusResult = useLibrusMessages(folder);

  return active?.provider === 'librus' ? librusResult : vulcanResult;
}
