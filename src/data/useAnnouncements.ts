import { useQuery } from '@tanstack/react-query';
import { getAnnouncements } from '../api/hebe/endpoints/announcements';
import { useActiveCredential } from '../auth/accountsContext';

export function useAnnouncements() {
  const activeInfo = useActiveCredential();
  const student = activeInfo?.students.find((s) => s.Pupil.Id === activeInfo.pupilId);
  const unitId = student?.Unit.Id;
  const enabled = Boolean(activeInfo && unitId !== undefined);

  const query = useQuery({
    queryKey: ['announcements', activeInfo?.credential.tenant, activeInfo?.pupilId],
    queryFn: () => getAnnouncements(activeInfo!.credential, { unitId: unitId!, pupilId: activeInfo!.pupilId }),
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
