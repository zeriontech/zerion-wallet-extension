import { useAddressPortfolioDecomposition } from 'defi-sdk';
import React, { useMemo, useRef } from 'react';
import { useMutation, useQuery } from 'react-query';
import { createChain } from 'src/modules/networks/Chain';
import { useNetworks } from 'src/modules/networks/useNetworks';
import { getNameFromOrigin } from 'src/shared/dapps';
import { invariant } from 'src/shared/invariant';
import { AngleRightRow } from 'src/ui/components/AngleRightRow';
import { NetworkSelectDialog } from 'src/ui/components/NetworkSelectDialog';
import { SiteFaviconImg } from 'src/ui/components/SiteFaviconImg';
import { walletPort } from 'src/ui/shared/channels';
import { getActiveTabOrigin } from 'src/ui/shared/requests/getActiveTabOrigin';
import { useIsConnectedToActiveTab } from 'src/ui/shared/requests/useIsConnectedToActiveTab';
import { Button } from 'src/ui/ui-kit/Button';
import { Media } from 'src/ui/ui-kit/Media';
import { BottomSheetDialog } from 'src/ui/ui-kit/ModalDialogs/BottomSheetDialog';
import type { HTMLDialogElementInterface } from 'src/ui/ui-kit/ModalDialogs/HTMLDialogElementInterface';
import { showConfirmDialog } from 'src/ui/ui-kit/ModalDialogs/showConfirmDialog';
import { SurfaceList } from 'src/ui/ui-kit/SurfaceList';
import { UIText } from 'src/ui/ui-kit/UIText';
import { VStack } from 'src/ui/ui-kit/VStack';
import * as s from './styles.module.css';

export function CurrentNetwork({ address }: { address: string }) {
  const { value: portfolioDecomposition } = useAddressPortfolioDecomposition({
    address,
    currency: 'usd',
  });
  const { data: tabData } = useQuery('activeTab/origin', getActiveTabOrigin);
  const tabOrigin = tabData?.tabOrigin;
  const { data: isConnected } = useIsConnectedToActiveTab(address);
  const { data: flaggedAsDapp } = useQuery(
    `wallet/isFlaggedAsDapp(${tabOrigin})`,
    () => {
      invariant(tabOrigin, 'tabOrigin must be defined');
      return walletPort.request('isFlaggedAsDapp', { origin: tabOrigin });
    },
    { enabled: Boolean(tabOrigin) }
  );
  const { data: siteChain, ...chainQuery } = useQuery(
    `wallet/requestChainForOrigin(${tabOrigin})`,
    async () =>
      !tabOrigin
        ? null
        : walletPort
            .request('requestChainForOrigin', { origin: tabOrigin })
            .then((chain) => createChain(chain)),
    { enabled: Boolean(tabOrigin), useErrorBoundary: true, suspense: false }
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

  if (!networks || !siteChain || !tabOrigin) {
    return null;
  }
  if (!hasSomePermissions && !flaggedAsDapp) {
    return null;
  }

  return (
    <>
      <BottomSheetDialog ref={ref} style={{ height: '82vh', padding: 0 }}>
        <NetworkSelectDialog
          value={siteChain.toString()}
          type="connection"
          chainDistribution={portfolioDecomposition}
          mainViewLeadingComponent={
            <VStack gap={0} style={{ paddingTop: 8, paddingBottom: 16 }}>
              <UIText
                kind="small/accent"
                color="var(--neutral-500)"
                style={{ paddingInline: 16 }}
              >
                {isConnected ? 'Connected to' : 'Connect to'}
              </UIText>
              <SurfaceList
                items={[
                  {
                    key: 0,
                    to: `/connected-sites/${encodeURIComponent(tabOrigin)}`,
                    component: (
                      <AngleRightRow>
                        <Media
                          image={
                            <SiteFaviconImg
                              url={tabOrigin}
                              size={24}
                              style={{ display: 'block' }}
                            />
                          }
                          text={getNameFromOrigin(tabOrigin)}
                          detailText={null}
                        />
                      </AngleRightRow>
                    ),
                  },
                ]}
              />
            </VStack>
          }
        />
      </BottomSheetDialog>
      <Button
        kind="ghost"
        size={40}
        title={getNameFromOrigin(tabOrigin)}
        onClick={() => {
          if (ref.current) {
            showConfirmDialog(ref.current).then((value) => {
              switchChainMutation.mutate({ chain: value, origin: tabOrigin });
            });
          }
        }}
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
              size={24}
              style={{ display: 'block', borderRadius: '50%' }}
            />
          </div>
          {isConnected ? <div className={s.activeIndicator} /> : null}
        </div>
      </Button>
    </>
  );
}
