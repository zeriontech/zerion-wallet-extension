import { useLastBackedUp } from 'src/ui/shared/requests/useLastBackedUp';

export function useBackupTodosCount() {
  const { data } = useLastBackedUp();
  if (data === null) {
    return 1; // did not backup yet
  }
  return 0; // either no data or already backed up
}
