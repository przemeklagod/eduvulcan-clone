import { useQuery } from '@tanstack/react-query';
import { getAddressBook } from '../api/hebe/endpoints/teachers';
import { useActiveCredential } from '../auth/accountsContext';

export function useAddressBook() {
  const activeInfo = useActiveCredential();
  const student = activeInfo?.students.find((s) => s.Pupil.Id === activeInfo.pupilId);
  const box = student?.MessageBox?.GlobalKey;
  const enabled = Boolean(activeInfo && box);

  const query = useQuery({
    queryKey: ['addressbook', activeInfo?.credential.tenant, activeInfo?.pupilId],
    queryFn: () => getAddressBook(activeInfo!.credential, box!),
    enabled,
  });

  return {
    addresses: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
  };
}
