import { useQuery } from '@tanstack/react-query';
import { walletPort } from 'src/ui/shared/channels';

function useNoBackupCount() {
  return useQuery({
    queryKey: ['wallet/getNoBackupCount'],
    queryFn: () => {
      return walletPort.request('getNoBackupCount');
    },
    useErrorBoundary: true,
  });
}
export function useBackupTodosCount() {
  const { data: count } = useNoBackupCount();
  return count ?? 0;
}
