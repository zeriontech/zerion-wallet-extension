import React, { useMemo } from 'react';
import { animated } from '@react-spring/web';
import { useMutation, useQuery } from '@tanstack/react-query';
import ArrowRightIcon from 'jsx:src/ui/assets/arrow-right.svg';
import ArrowDownIcon from 'jsx:src/ui/assets/caret-down-filled.svg';
import { capitalize } from 'capitalize-ts';
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
import { createChain } from 'src/modules/networks/Chain';
import {
  useMainnetNetwork,
  useNetworks,
} from 'src/modules/networks/useNetworks';
import { Networks } from 'src/modules/networks/Networks';
import { NetworkIcon } from 'src/ui/components/NetworkIcon';
import { usePreferences } from 'src/ui/features/preferences';
import { requestChainForOrigin } from 'src/ui/shared/requests/requestChainForOrigin';
import { getAddressType } from 'src/shared/wallet/classifiers';
import { isMatchForEcosystem } from 'src/shared/wallet/shared';
import { isSolanaAddress } from 'src/modules/solana/shared';
import { isEthereumAddress } from 'src/shared/isEthereumAddress';
import { NetworkSelect } from '../../Networks/NetworkSelect';
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
      to="/connected-sites"
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

function NetworksDisclosureButton({
  value,
  openDialog,
}: {
  value: string;
  openDialog: () => void;
}) {
  const { networks, isLoading } = useNetworks();
  const { preferences } = usePreferences();
  const selectedNetwork = networks?.getNetworkByName(createChain(value));

  const { data: mainnetNetwork } = useMainnetNetwork({
    chain: value,
    enabled:
      Boolean(preferences?.testnetMode?.on) && !isLoading && !selectedNetwork,
  });
  const chain = createChain(value);
  const network = selectedNetwork || mainnetNetwork;

  if (isLoading) {
    return null;
  }

  return (
    <Button
      size={36}
      kind="neutral"
      onClick={openDialog}
      style={{
        paddingInline: '8px 4px',
        ['--button-text-hover' as string]: 'var(--neutral-800)',
        ['--parent-content-color' as string]: 'var(--neutral-500)',
        ['--parent-hovered-content-color' as string]: 'var(--black)',
      }}
      className="parent-hover"
    >
      <HStack gap={8} alignItems="center">
        {network ? (
          <NetworkIcon size={24} src={network.icon_url} name={network.name} />
        ) : null}
        <span style={{ display: 'inline-flex', alignItems: 'center' }}>
          <span
            style={{
              maxWidth: 90,
              overflow: 'hidden',
              whiteSpace: 'nowrap',
              textOverflow: 'ellipsis',
            }}
          >
            {network?.name || capitalize(String(chain))}
          </span>
          <ArrowDownIcon
            className="content-hover"
            style={{ width: 20, height: 20 }}
          />
        </span>
      </HStack>
    </Button>
  );
}

function DappChainSwitcher({
  originName,
  address,
}: {
  originName: string;
  address: string;
}) {
  const { data: siteChain, refetch } = useQuery({
    queryKey: ['requestChainForOrigin', originName, address],
    queryFn: () => requestChainForOrigin(originName, getAddressType(address)),
    useErrorBoundary: true,
    suspense: false,
  });

  const switchChainMutation = useMutation({
    mutationFn: (chain: string) => {
      if (isSolanaAddress(address)) {
        return walletPort.request('switchChainForOrigin', {
          solanaChain: chain,
          origin: originName,
        });
      } else if (isEthereumAddress(address)) {
        return walletPort.request('switchChainForOrigin', {
          evmChain: chain,
          origin: originName,
        });
      } else {
        throw new Error('Cannot determine current address type');
      }
    },
    useErrorBoundary: true,
    onSuccess: () => refetch(),
  });

  if (!siteChain) {
    return null;
  }

  return (
    <HStack
      gap={8}
      alignItems="center"
      justifyContent="space-between"
      style={{ width: '100%', gridTemplateColumns: 'auto 1fr' }}
    >
      <UIText kind="body/accent">Network</UIText>
      <div style={{ justifySelf: 'end' }}>
        <NetworkSelect
          standard={getAddressType(address)}
          showEcosystemHint={true}
          value={siteChain.toString()}
          filterPredicate={(network) =>
            isMatchForEcosystem(address, Networks.getEcosystem(network))
          }
          onChange={(value) => switchChainMutation.mutate(value)}
          renderButton={({ openDialog, value }) => (
            <NetworksDisclosureButton value={value} openDialog={openDialog} />
          )}
        />
      </div>
    </HStack>
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
      {currentWalletIsConnected && currentAddress ? (
        <DappChainSwitcher
          originName={connectedSite.origin}
          address={currentAddress}
        />
      ) : null}
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
