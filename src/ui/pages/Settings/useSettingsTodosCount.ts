import { useBackupTodosCount } from 'src/ui/shared/requests/useBackupTodosCount';

export function useSettingsTodosCount() {
  return useBackupTodosCount();
}
