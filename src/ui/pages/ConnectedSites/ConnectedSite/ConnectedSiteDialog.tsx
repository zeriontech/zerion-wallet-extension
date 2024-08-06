import React, { useMemo } from 'react';
import { animated } from '@react-spring/web';
import { useQuery } from '@tanstack/react-query';
import ArrowRightIcon from 'jsx:src/ui/assets/arrow-right.svg';
import { invariant } from 'src/shared/invariant';
import { useTransformTrigger } from 'src/ui/components/useTransformTrigger';
import { getPermissionsWithWallets } from 'src/ui/shared/requests/getPermissionsWithWallets';
import { HStack } from 'src/ui/ui-kit/HStack';
import { UIText } from 'src/ui/ui-kit/UIText';
import { UnstyledLink } from 'src/ui/ui-kit/UnstyledLink';
import { normalizeAddress } from 'src/shared/normalizeAddress';
import { walletPort } from 'src/ui/shared/channels';
import { EmptyView } from 'src/ui/components/EmptyView';
import { getNameFromOrigin } from 'src/shared/dapps';
import { VStack } from 'src/ui/ui-kit/VStack';
import { Surface } from 'src/ui/ui-kit/Surface';
import { Button } from 'src/ui/ui-kit/Button';
import { getConnectedSite } from '../shared/getConnectedSite';
import { MetamaskMode } from './MetamaskMode';
import { DisconnectFromDappButton } from './DisconnectFromDappButton';

function ConnectedSitesPageLink() {
  const { style: iconStyle, trigger: hoverTrigger } = useTransformTrigger({
    x: 2,
  });

  return (
    <Button
      kind="neutral"
      size={48}
      as={UnstyledLink}
      to={`/connected-sites`}
      onMouseEnter={hoverTrigger}
      className="parent-hover"
      style={{
        ['--parent-content-color' as string]: 'var(--neutral-500)',
        ['--parent-hovered-content-color' as string]: 'var(--black)',
      }}
    >
      <HStack gap={8} alignItems="center">
        <UIText kind="small/accent">All Connections</UIText>
        <animated.div style={{ ...iconStyle, display: 'flex' }}>
          <ArrowRightIcon
            style={{ width: 20, height: 20 }}
            className="content-hover"
          />
        </animated.div>
      </HStack>
    </Button>
  );
}

export function ConnectedSiteDialog({
  originName,
  onDismiss,
}: {
  originName: string | null;
  onDismiss(): void;
}) {
  invariant(originName, 'originName parameter is required for this view');
  const { data: connectedSites, refetch } = useQuery({
    queryKey: ['getPermissionsWithWallets'],
    queryFn: getPermissionsWithWallets,
    useErrorBoundary: true,
    suspense: false,
  });
  const connectedSite = useMemo(
    () => getConnectedSite(originName, connectedSites),
    [connectedSites, originName]
  );
  const siteOrigin = connectedSite?.origin;
  const siteHostname = siteOrigin ? new URL(siteOrigin).hostname : null;

  const { data: currentWallet } = useQuery({
    queryKey: ['wallet/uiGetCurrentWallet'],
    queryFn: () => {
      return walletPort.request('uiGetCurrentWallet');
    },
  });
  invariant(currentWallet, 'Current wallet not found');
  const currentAddress = currentWallet?.address;
  const currentWalletIsConnected = useMemo(
    () =>
      currentAddress
        ? connectedSite?.addresses.some(
            (address) =>
              normalizeAddress(address) === normalizeAddress(currentAddress)
          )
        : false,
    [connectedSite?.addresses, currentAddress]
  );

  if (!connectedSite) {
    return <EmptyView>Site not found</EmptyView>;
  }
  const title = getNameFromOrigin(connectedSite.origin);

  return (
    <VStack gap={24} style={{ justifyItems: 'center' }}>
      <UIText kind="headline/h2" style={{ textAlign: 'center' }}>
        {siteHostname}
      </UIText>
      <label style={{ width: '100%' }}>
        <Surface
          style={{
            borderRadius: 16,
            border: '2px solid var(--neutral-200)',
            padding: 12,
            cursor: 'pointer',
          }}
        >
          <MetamaskMode
            originName={originName}
            onClick={() => setTimeout(onDismiss, 300)}
          />
        </Surface>
      </label>
      <HStack
        gap={8}
        style={{
          width: '100%',
          gridTemplateColumns: currentWalletIsConnected ? '1fr 1fr' : '50%',
          justifyContent: currentWalletIsConnected ? undefined : 'center',
        }}
      >
        {currentWalletIsConnected ? (
          <DisconnectFromDappButton
            wallet={currentWallet}
            origin={connectedSite.origin}
            originTitle={title}
            onSuccess={() => {
              refetch();
              onDismiss();
            }}
          />
        ) : null}
        <ConnectedSitesPageLink />
      </HStack>
    </VStack>
  );
}
