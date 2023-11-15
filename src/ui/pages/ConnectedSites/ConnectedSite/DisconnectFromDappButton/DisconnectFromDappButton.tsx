import React from 'react';
import type { ExternallyOwnedAccount } from 'src/shared/types/ExternallyOwnedAccount';
import { UIText } from 'src/ui/ui-kit/UIText';
import { queryClient } from 'src/ui/shared/requests/queryClient';
import { normalizeAddress } from 'src/shared/normalizeAddress';
import { Button } from 'src/ui/ui-kit/Button';
import { useRemovePermissionMutation } from '../../shared/useRemovePermission';

export function DisconnectFromDappButton({
  wallet,
  origin,
  onSuccess,
}: {
  origin: string;
  originTitle: string;
  wallet: ExternallyOwnedAccount;
  onSuccess?: () => void;
}) {
  const normalizedAddress = normalizeAddress(wallet.address);
  const removePermissionMutation = useRemovePermissionMutation({
    onSuccess: () => {
      queryClient.refetchQueries({
        queryKey: ['isAccountAvailableToOrigin', normalizedAddress, origin],
      });
      onSuccess?.();
    },
  });

  return (
    <Button
      size={48}
      kind="danger"
      onClick={() => {
        removePermissionMutation.mutate({
          address: normalizedAddress,
          origin,
        });
      }}
      disabled={removePermissionMutation.isLoading}
    >
      <UIText kind="small/accent">
        {removePermissionMutation.isLoading
          ? 'Disconnecting…'
          : 'Disconnect Wallet'}
      </UIText>
    </Button>
  );
}
