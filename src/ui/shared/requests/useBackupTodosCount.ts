import { useSuspenseQuery } from '@tanstack/react-query';
import { walletPort } from 'src/ui/shared/channels';

function useNoBackupCount() {
  return useSuspenseQuery({
    queryKey: ['wallet/getNoBackupCount'],
    queryFn: () => {
      return walletPort.request('getNoBackupCount');
    },
  });
}
export function useBackupTodosCount() {
  const { data: count } = useNoBackupCount();
  return count ?? 0;
}
