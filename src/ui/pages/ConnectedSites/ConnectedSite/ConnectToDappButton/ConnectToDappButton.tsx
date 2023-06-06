import React from 'react';
import { useMutation } from '@tanstack/react-query';
import type { BareWallet } from 'src/shared/types/BareWallet';
import { walletPort } from 'src/ui/shared/channels';
import { SurfaceList } from 'src/ui/ui-kit/SurfaceList';
import { UIText } from 'src/ui/ui-kit/UIText';
import { VStack } from 'src/ui/ui-kit/VStack';

export function ConnectToDappButton({
  wallet,
  origin,
  onSuccess,
}: {
  origin: string;
  originTitle: string;
  wallet: BareWallet;
  onSuccess: () => void;
}) {
  const acceptOriginAndConnectMutation = useMutation({
    mutationFn: async ({
      address,
      origin,
    }: {
      address: string;
      origin: string;
    }) => {
      await walletPort.request('acceptOrigin', { origin, address });
      return walletPort.request('emitConnectionEvent', { origin });
    },
    onSuccess,
  });
  return (
    <VStack gap={4}>
      <SurfaceList
        items={[
          {
            key: 0,
            pad: false,
            onClick: () => {
              acceptOriginAndConnectMutation.mutate({
                address: wallet.address,
                origin,
              });
            },
            disabled: acceptOriginAndConnectMutation.isLoading,
            component: (
              <UIText kind="small/regular" color="var(--primary)">
                {acceptOriginAndConnectMutation.isLoading
                  ? 'Connecting…'
                  : 'Connect to this DApp'}
              </UIText>
            ),
          },
        ]}
      />
    </VStack>
  );
}
