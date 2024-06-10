import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { PageColumn } from 'src/ui/components/PageColumn';
import { PageTop } from 'src/ui/components/PageTop';
import { walletPort, windowPort } from 'src/ui/shared/channels';
import { Spacer } from 'src/ui/ui-kit/Spacer';
import { UIText } from 'src/ui/ui-kit/UIText';
import { VStack } from 'src/ui/ui-kit/VStack';
import { Button } from 'src/ui/ui-kit/Button';
import { useQuery } from '@tanstack/react-query';
import { invariant } from 'src/shared/invariant';
import { useNetworks } from 'src/modules/networks/useNetworks';
import { NavigationTitle } from 'src/ui/components/NavigationTitle';
import { HStack } from 'src/ui/ui-kit/HStack';
import { SiteFaviconImg } from 'src/ui/components/SiteFaviconImg';
import { PageStickyFooter } from 'src/ui/components/PageStickyFooter';
import { PageBottom } from 'src/ui/components/PageBottom';
import { NetworkIcon } from 'src/ui/components/NetworkIcon';
import { noValueDash } from 'src/ui/shared/typography';
import { useBackgroundKind } from 'src/ui/components/Background';
import { normalizeChainId } from 'src/shared/normalizeChainId';
import { whiteBackgroundKind } from 'src/ui/components/Background/Background';
import { ValueCell } from '../Networks/shared/ValueCell';

export function SwitchEthereumChain() {
  useBackgroundKind(whiteBackgroundKind);

  const [params] = useSearchParams();
  const { networks } = useNetworks();
  const {
    data: wallet,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['wallet/uiGetCurrentWallet'],
    queryFn: () => {
      return walletPort.request('uiGetCurrentWallet');
    },
  });
  if (isError) {
    return <p>Some Error</p>;
  }
  if (isLoading || !wallet || !networks) {
    return null;
  }
  const origin = params.get('origin');
  if (!origin) {
    throw new Error('origin get-parameter is required for this view');
  }
  const originName = new URL(origin).hostname;
  const rawChainId = params.get('chainId');
  invariant(rawChainId, 'This view requires a chainId get-param');
  const chainId = normalizeChainId(rawChainId);

  const chain = networks.getChainById(chainId);
  const network = networks.getNetworkByName(chain);
  invariant(network, 'Network config does not exists');

  return (
    <>
      <PageColumn>
        <NavigationTitle title={null} documentTitle="Switch network" />
        <PageTop />
        <div
          style={{
            padding: 16,
            border: '1px solid var(--neutral-400)',
            borderRadius: 12,
          }}
        >
          <VStack gap={8}>
            <HStack gap={8} alignItems="center">
              <SiteFaviconImg url={origin} alt="" size={32} />
              <UIText kind="headline/h2">{originName}</UIText>
            </HStack>
            <UIText kind="small/accent" color="var(--neutral-500)">
              Suggests you switch current network
            </UIText>
          </VStack>
        </div>
        <Spacer height={24} />
        <VStack gap={32} style={{ justifyItems: 'center' }}>
          <VStack gap={4} style={{ justifyItems: 'center' }}>
            <NetworkIcon src={network.icon_url} size={40} name={network.name} />
            <UIText kind="headline/h1">{networks.getChainName(chain)}</UIText>
          </VStack>
          <VStack
            gap={8}
            style={{ justifyItems: 'center', textAlign: 'center' }}
          >
            <ValueCell
              label="RPC URL"
              value={networks.getRpcUrlPublic(chain)}
            />
            <ValueCell label="Chain ID" value={chainId} />
            <ValueCell
              label="Currency Symbol"
              value={network.native_asset?.symbol ?? noValueDash}
            />
            <ValueCell
              label="Block Explorer URL"
              value={network.explorer_home_url || noValueDash}
            />
          </VStack>
        </VStack>
      </PageColumn>
      <PageStickyFooter>
        <Spacer height={16} />
        <div
          style={{
            marginTop: 'auto',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 8,
          }}
        >
          <Button
            kind="regular"
            onClick={() => {
              const windowId = params.get('windowId');
              invariant(windowId, 'windowId get-parameter is required');
              windowPort.reject(windowId);
            }}
          >
            Reject
          </Button>
          <Button
            onClick={() => {
              const windowId = params.get('windowId');
              invariant(windowId, 'windowId get-parameter is required');
              windowPort.confirm(windowId, null);
            }}
          >
            Approve
          </Button>
        </div>
        <PageBottom />
      </PageStickyFooter>
    </>
  );
}
