import { useMutation } from '@tanstack/react-query';
import { walletPort } from 'src/ui/shared/channels';

export function useRemovePermissionMutation({
  onSuccess,
}: {
  onSuccess?: () => void;
}) {
  return useMutation({
    mutationFn: ({ origin, address }: { origin: string; address?: string }) => {
      return walletPort.request('removePermission', { origin, address });
    },
    onSuccess,
  });
}
