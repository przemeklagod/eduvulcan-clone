import { useQuery } from '@tanstack/react-query';
import { getExams } from '../api/hebe/endpoints/exams';
import { useAccounts, useActiveCredential } from '../auth/accountsContext';
import { formatDateForApi } from '../utils/dates';
import { useLibrusExams } from './useLibrusExams';

function useVulcanExams() {
  const activeInfo = useActiveCredential();
  const student = activeInfo?.students.find((s) => s.Pupil.Id === activeInfo.pupilId);
  const periods = student?.Periods ?? [];
  const dateFrom = periods[0]?.StartAt;
  const dateTo = periods[periods.length - 1]?.EndAt ?? formatDateForApi(new Date());
  const enabled = Boolean(activeInfo && dateFrom);

  const query = useQuery({
    queryKey: ['exams', activeInfo?.credential.tenant, activeInfo?.pupilId, dateFrom, dateTo],
    queryFn: () => getExams(activeInfo!.credential, { pupilId: activeInfo!.pupilId, dateFrom: dateFrom!, dateTo }),
    enabled,
  });

  return {
    exams: query.data ?? [],
    isLoading: query.isLoading,
    isRefetching: query.isRefetching,
    error: query.error,
    refetch: query.refetch,
    hasActiveStudent: enabled,
  };
}

export function useExams() {
  const { active } = useAccounts();
  const vulcanResult = useVulcanExams();
  const librusResult = useLibrusExams();

  return active?.provider === 'librus' ? librusResult : vulcanResult;
}
