import React, { useMemo, useRef } from 'react';
import { useMutation, useQuery } from 'react-query';
import { createChain } from 'src/modules/networks/Chain';
import { useNetworks } from 'src/modules/networks/useNetworks';
import { NetworkSelectDialog } from 'src/ui/components/NetworkSelectDialog';
import { SiteFaviconImg } from 'src/ui/components/SiteFaviconImg';
import { walletPort } from 'src/ui/shared/channels';
import { getActiveTabOrigin } from 'src/ui/shared/requests/getActiveTabOrigin';
import { useIsConnectedToActiveTab } from 'src/ui/shared/requests/useIsConnectedToActiveTab';
import { Button } from 'src/ui/ui-kit/Button';
import { CenteredDialog } from 'src/ui/ui-kit/ModalDialogs/CenteredDialog';
import { DialogTitle } from 'src/ui/ui-kit/ModalDialogs/DialogTitle';
import type { HTMLDialogElementInterface } from 'src/ui/ui-kit/ModalDialogs/HTMLDialogElementInterface';
import { showConfirmDialog } from 'src/ui/ui-kit/ModalDialogs/showConfirmDialog';
import { Spacer } from 'src/ui/ui-kit/Spacer';
import { UIText } from 'src/ui/ui-kit/UIText';
import { UnstyledLink } from 'src/ui/ui-kit/UnstyledLink';
import * as s from './styles.module.css';

export function CurrentNetwork({ address }: { address: string }) {
  const { data: tabOrigin } = useQuery('activeTab/origin', getActiveTabOrigin);
  const { data: isConnected } = useIsConnectedToActiveTab(address);
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

  if (!hasSomePermissions || !networks) {
    return null;
  }

  return (
    <>
      {tabOrigin && siteChain ? (
        <CenteredDialog
          ref={ref}
          style={{ backgroundColor: 'var(--neutral-100)' }}
        >
          <DialogTitle
            title={
              <UIText kind="subtitle/m_med">
                Network for {new URL(tabOrigin).hostname}
              </UIText>
            }
          />
          <Spacer height={24} />
          <NetworkSelectDialog value={siteChain.toString()} />
        </CenteredDialog>
      ) : null}

      {tabOrigin ? (
        <Button
          kind="ghost"
          size={40}
          as={UnstyledLink}
          to={`/connected-sites/${encodeURIComponent(tabOrigin)}`}
        >
          <div style={{ position: 'relative' }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                border: '2px solid',
                borderColor: isConnected
                  ? 'var(--positive-400)'
                  : 'var(--primary)',
                padding: 2,
              }}
              className={isConnected ? s.activeIndicatorClip : undefined}
            >
              <SiteFaviconImg
                url={tabOrigin}
                style={{
                  width: 24,
                  height: 24,
                  display: 'block',
                  borderRadius: '50%',
                }}
              />
            </div>
            {isConnected ? <div className={s.activeIndicator} /> : null}
          </div>
        </Button>
      ) : null}
      {siteChain && tabOrigin ? (
        <Button
          kind="ghost"
          size={40}
          style={{ fontWeight: 400, paddingInline: 8 }}
          disabled={!hasSomePermissions}
          onClick={() => {
            if (ref.current) {
              showConfirmDialog(ref.current).then((value) => {
                switchChainMutation.mutate({ chain: value, origin: tabOrigin });
              });
            }
          }}
        >
          <img
            src={networks.getNetworkByName(siteChain)?.icon_url || ''}
            alt=""
            style={{ width: 24, height: 24, display: 'block' }}
          />
        </Button>
      ) : null}
    </>
  );
}
