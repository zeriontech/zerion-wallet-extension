import React, { useMemo, useRef } from 'react';
import { useMutation, useQuery } from 'react-query';
import { createChain } from 'src/modules/networks/Chain';
import { useNetworks } from 'src/modules/networks/useNetworks';
import { NetworkSelectDialog } from 'src/ui/components/NetworkSelectDialog';
import { walletPort } from 'src/ui/shared/channels';
import { getActiveTabOrigin } from 'src/ui/shared/requests/getActiveTabOrigin';
import { Button } from 'src/ui/ui-kit/Button';
import { HStack } from 'src/ui/ui-kit/HStack';
import { CenteredDialog } from 'src/ui/ui-kit/ModalDialogs/CenteredDialog';
import { DialogTitle } from 'src/ui/ui-kit/ModalDialogs/DialogTitle';
import type { HTMLDialogElementInterface } from 'src/ui/ui-kit/ModalDialogs/HTMLDialogElementInterface';
import { showConfirmDialog } from 'src/ui/ui-kit/ModalDialogs/showConfirmDialog';
import { UIText } from 'src/ui/ui-kit/UIText';

export function CurrentNetwork() {
  const { data: tabOrigin } = useQuery('activeTab/origin', getActiveTabOrigin);
  const { data: siteChain, ...chainQuery } = useQuery(
    `wallet/requestChainForOrigin(${tabOrigin})`,
    async () =>
      !tabOrigin
        ? null
        : walletPort
            .request('requestChainForOrigin', { origin: tabOrigin })
            .then((chain) => createChain(chain)),
    { enabled: Boolean(tabOrigin), useErrorBoundary: true, suspense: true }
  );
  const switchChainMutation = useMutation(
    ({ chain, origin }: { chain: string; origin: string }) =>
      walletPort.request('switchChainForOrigin', { chain, origin }),
    { useErrorBoundary: true, onSuccess: () => chainQuery.refetch() }
  );
  const { data: permissions } = useQuery(
    'wallet/getOriginPermissions',
    () => walletPort.request('getOriginPermissions'),
    { useErrorBoundary: true }
  );

  const ref = useRef<HTMLDialogElementInterface | null>(null);
  const hasSomePermissions = useMemo(() => {
    return tabOrigin && permissions?.[tabOrigin];
  }, [permissions, tabOrigin]);

  const { networks } = useNetworks();

  if (!hasSomePermissions) {
    return null;
  }

  return (
    <>
      {tabOrigin && siteChain ? (
        <CenteredDialog ref={ref}>
          <DialogTitle
            title={
              <UIText kind="subtitle/m_med">
                Network for {new URL(tabOrigin).hostname}
              </UIText>
            }
          />
          <NetworkSelectDialog value={siteChain.toString()} />
        </CenteredDialog>
      ) : null}

      {siteChain && tabOrigin ? (
        <Button
          kind="ghost"
          size={28}
          style={{ fontWeight: 400 }}
          disabled={!hasSomePermissions}
          onClick={() => {
            if (ref.current) {
              showConfirmDialog(ref.current).then((value) => {
                switchChainMutation.mutate({ chain: value, origin: tabOrigin });
              });
            }
          }}
        >
          <HStack gap={4} alignItems="center">
            <img
              src={networks?.getNetworkByName(siteChain)?.icon_url || ''}
              alt=""
              style={{ width: 16, height: 16 }}
            />
            {networks?.getChainName(siteChain) || null}
          </HStack>
        </Button>
      ) : null}
    </>
  );
}
