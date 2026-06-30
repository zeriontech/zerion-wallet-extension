import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import ArrowDownIcon from 'jsx:src/ui/assets/caret-down-filled.svg';
import { createChain } from 'src/modules/networks/Chain';
import {
  useMainnetNetwork,
  useNetworks,
} from 'src/modules/networks/useNetworks';
import { getAddressType } from 'src/shared/wallet/classifiers';
import { NetworkIcon } from 'src/ui/components/NetworkIcon';
import { SiteFaviconImg } from 'src/ui/components/SiteFaviconImg';
import { usePreferences } from 'src/ui/features/preferences';
import { getActiveTabOrigin } from 'src/ui/shared/requests/getActiveTabOrigin';
import { requestChainForOrigin } from 'src/ui/shared/requests/requestChainForOrigin';
import { useIsConnectedToActiveTab } from 'src/ui/shared/requests/useIsConnectedToActiveTab';
import { useAddressParams } from 'src/ui/shared/user-address/useAddressParams';
import { StickyBottomPanel } from 'src/ui/ui-kit/BottomPanel';
import { HStack } from 'src/ui/ui-kit/HStack';
import { Dialog2 } from 'src/ui/ui-kit/ModalDialogs/Dialog2';
import { UIText } from 'src/ui/ui-kit/UIText';
import { UnstyledButton } from 'src/ui/ui-kit/UnstyledButton';
import { VStack } from 'src/ui/ui-kit/VStack';
import { ConnectedSiteDialog } from '../../ConnectedSites/ConnectedSite';
import { isConnectableDapp } from '../../ConnectedSites/shared/isConnectableDapp';

function ConnectedNetworkBadge({
  originName,
  address,
}: {
  originName: string;
  address: string;
}) {
  const { networks, isLoading } = useNetworks();
  const { preferences } = usePreferences();
  const { data: siteChain } = useQuery({
    queryKey: ['requestChainForOrigin', originName, address],
    queryFn: () => requestChainForOrigin(originName, getAddressType(address)),
    useErrorBoundary: true,
    suspense: false,
  });
  const value = siteChain?.toString();
  const selectedNetwork = value
    ? networks?.getNetworkByName(createChain(value))
    : null;
  const { data: mainnetNetwork } = useMainnetNetwork({
    chain: value || '',
    enabled:
      Boolean(preferences?.testnetMode?.on) &&
      !isLoading &&
      !selectedNetwork &&
      Boolean(value),
  });
  const network = selectedNetwork || mainnetNetwork;

  if (!network) {
    return null;
  }
  return (
    <HStack gap={4} alignItems="center">
      <NetworkIcon size={20} src={network.icon_url} name={network.name} />
      <ArrowDownIcon
        style={{ width: 20, height: 20, color: 'var(--neutral-500)' }}
      />
    </HStack>
  );
}

/**
 * Floating "<dapp> · Connected" banner pinned over the bottom of Overview
 * (same sticky panel as the Paused/Resume banner). Visible only when the
 * current wallet is connected to the active tab. Tapping it opens the
 * connection menu (which hosts the dapp chain switcher and disconnect).
 */
export function ConnectionBanner() {
  const { singleAddressNormalized: address } = useAddressParams();
  const { data: tabData } = useQuery({
    queryKey: ['activeTab/origin'],
    queryFn: getActiveTabOrigin,
    useErrorBoundary: true,
  });
  const { data: isConnected } = useIsConnectedToActiveTab(address);
  const [showDialog, setShowDialog] = useState(false);

  const activeTabOrigin = tabData?.tabOrigin;
  const hostname = tabData?.url.hostname;
  const isConnectableSite = tabData?.url
    ? isConnectableDapp(tabData.url)
    : false;

  if (!isConnected || !isConnectableSite || !activeTabOrigin) {
    return null;
  }
  return (
    <>
      <StickyBottomPanel
        style={{
          padding: '8px 12px 8px 16px',
          ['--background-color' as string]: 'var(--neutral-100)',
        }}
      >
        <UnstyledButton
          onClick={() => setShowDialog(true)}
          title="Site connection"
          aria-label="Site connection"
          style={{ width: '100%' }}
        >
          <HStack
            gap={8}
            alignItems="center"
            justifyContent="space-between"
            style={{ gridTemplateColumns: 'auto 1fr auto' }}
          >
            <div style={{ position: 'relative', top: 4 }}>
              <SiteFaviconImg
                url={activeTabOrigin}
                priorityUrl={tabData?.tab?.favIconUrl}
                size={24}
                style={{ borderRadius: 6 }}
              />
            </div>
            <VStack gap={0} style={{ justifyItems: 'start', minWidth: 0 }}>
              <UIText
                kind="small/accent"
                style={{
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  maxWidth: '100%',
                }}
              >
                {hostname}
              </UIText>
              <UIText kind="caption/regular" color="var(--positive-500)">
                Connected
              </UIText>
            </VStack>
            <ConnectedNetworkBadge
              originName={activeTabOrigin}
              address={address}
            />
          </HStack>
        </UnstyledButton>
      </StickyBottomPanel>
      <Dialog2
        open={showDialog}
        onClose={() => setShowDialog(false)}
        size="content"
      >
        <div style={{ paddingInline: 16, paddingBlock: 24 }}>
          <ConnectedSiteDialog
            originName={activeTabOrigin}
            onDismiss={() => setShowDialog(false)}
          />
        </div>
      </Dialog2>
    </>
  );
}
