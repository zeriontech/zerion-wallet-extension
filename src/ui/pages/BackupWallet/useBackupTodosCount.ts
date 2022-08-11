import { useQuery } from 'react-query';
import { walletPort } from 'src/ui/shared/channels';
// import { useLastBackedUp } from 'src/ui/shared/requests/useLastBackedUp';

function useNoBackupCount() {
  return useQuery(
    'wallet/getNoBackupCount',
    () => {
      return walletPort.request('getNoBackupCount');
    },
    { useErrorBoundary: true }
  );
}
export function useBackupTodosCount() {
  const { data: count } = useNoBackupCount();
  return count ?? 0;
  // if (data === null) {
  //   return 1; // did not backup yet
  // }
  // return 0; // either no data or already backed up
}
