import React, { useCallback, useMemo, useRef } from 'react';
import { capitalize } from 'capitalize-ts';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { NavigationTitle } from 'src/ui/components/NavigationTitle';
import { NotFoundPage } from 'src/ui/components/NotFoundPage';
import { PageColumn } from 'src/ui/components/PageColumn';
import type { ConnectedSiteItem } from 'src/ui/shared/requests/getPermissionsWithWallets';
import { getPermissionsWithWallets } from 'src/ui/shared/requests/getPermissionsWithWallets';
import { Spacer } from 'src/ui/ui-kit/Spacer';
import { TextAnchor } from 'src/ui/ui-kit/TextAnchor';
import { UIText } from 'src/ui/ui-kit/UIText';
import { VStack } from 'src/ui/ui-kit/VStack';
import { SurfaceList, SurfaceItemButton } from 'src/ui/ui-kit/SurfaceList';
import { HStack } from 'src/ui/ui-kit/HStack';
import { Media } from 'src/ui/ui-kit/Media';
import { WalletDisplayName } from 'src/ui/components/WalletDisplayName';
import { truncateAddress } from 'src/ui/shared/truncateAddress';
import { Button } from 'src/ui/ui-kit/Button';
import { PageBottom } from 'src/ui/components/PageBottom';
import { BottomSheetDialog } from 'src/ui/ui-kit/ModalDialogs/BottomSheetDialog';
import { GenericPrompt } from 'src/ui/components/GenericPrompt';
import type { HTMLDialogElementInterface } from 'src/ui/ui-kit/ModalDialogs/HTMLDialogElementInterface';
import { showConfirmDialog } from 'src/ui/ui-kit/ModalDialogs/showConfirmDialog';
import { walletPort } from 'src/ui/shared/channels';
import { createChain } from 'src/modules/networks/Chain';
import { NetworkSelectDialog } from 'src/ui/components/NetworkSelectDialog';
import { getWalletDisplayName } from 'src/ui/shared/getWalletDisplayName';
import { normalizeAddress } from 'src/shared/normalizeAddress';
import { getActiveTabOrigin } from 'src/ui/shared/requests/getActiveTabOrigin';
import { apostrophe } from 'src/ui/shared/typography';
import { getNameFromOrigin } from 'src/shared/dapps';
import { WalletAvatar } from 'src/ui/components/WalletAvatar';
import { useAddressPortfolioDecomposition } from 'defi-sdk';
import { useAddressParams } from 'src/ui/shared/user-address/useAddressParams';
import { invariant } from 'src/shared/invariant';
import { prepareForHref } from 'src/ui/shared/prepareForHref';
import { useWalletNameFlags } from 'src/ui/shared/requests/useWalletNameFlags';
import { Toggle } from 'src/ui/ui-kit/Toggle';
import { WalletNameFlag } from 'src/shared/types/WalletNameFlag';
import { reloadActiveTab } from 'src/ui/shared/reloadActiveTab';
import { CurrentNetworkSettingsItem } from '../../Networks/CurrentNetworkSettingsItem';
import { ConnectToDappButton } from './ConnectToDappButton';

function useRemovePermissionMutation({ onSuccess }: { onSuccess: () => void }) {
  return useMutation({
    mutationFn: ({ origin, address }: { origin: string; address?: string }) => {
      return walletPort.request('removePermission', { origin, address });
    },
    onSuccess,
  });
}

function RevokeAllSurfaceItemButton({
  origin,
  onSuccess,
}: {
  origin: string;
  onSuccess: () => void;
}) {
  const removePermissionMutation = useRemovePermissionMutation({ onSuccess });
  const removeActionDialogRef = useRef<HTMLDialogElementInterface | null>(null);

  return (
    <>
      <BottomSheetDialog ref={removeActionDialogRef} style={{ height: '30vh' }}>
        <GenericPrompt message="The site will ask for permission next time" />
      </BottomSheetDialog>
      <SurfaceItemButton
        onClick={() => {
          if (removeActionDialogRef.current) {
            showConfirmDialog(removeActionDialogRef.current).then(() => {
              removePermissionMutation.mutate({ origin });
            });
          }
        }}
      >
        <UIText kind="small/regular" color="var(--negative-500)">
          {removePermissionMutation.isLoading ? 'Loading...' : 'Revoke All'}
        </UIText>
      </SurfaceItemButton>
    </>
  );
}

function createConnectedSite({
  origin,
}: {
  origin: string;
}): ConnectedSiteItem {
  return {
    origin,
    addresses: [],
    wallets: [],
  };
}

export function ConnectedSite() {
  const { originName } = useParams();
  invariant(originName, 'originName parameter is required for this view');
  // TODO:
  // Refactor these calls to only have one "useQuery" call, but keep in mind
  // that related queries on Overview must be refetched after mutations made here
  const { data: tabData } = useQuery({
    queryKey: ['activeTab/origin'],
    queryFn: getActiveTabOrigin,
    useErrorBoundary: true,
  });
  const activeTabOrigin = tabData?.tabOrigin;
  const { data: connectedSites, refetch } = useQuery({
    queryKey: ['getPermissionsWithWallets'],
    queryFn: getPermissionsWithWallets,
    useErrorBoundary: true,
  });
  const { data: flaggedAsDapp } = useQuery({
    queryKey: [`wallet/isFlaggedAsDapp(${originName})`],
    queryFn: () =>
      walletPort.request('isFlaggedAsDapp', { origin: originName }),
  });
  const connectedSite = useMemo(() => {
    const found = connectedSites?.find((site) => site.origin === originName);
    if (found) {
      return found;
    } else if (flaggedAsDapp) {
      return createConnectedSite({ origin: originName });
    }
  }, [connectedSites, flaggedAsDapp, originName]);
  const siteOrigin = connectedSite?.origin;
  const connectedSiteOriginForHref = useMemo(
    () => (siteOrigin ? prepareForHref(siteOrigin) : null),
    [siteOrigin]
  );
  const { data: siteChain, ...chainQuery } = useQuery({
    queryKey: [`wallet/requestChainForOrigin(${originName})`],
    queryFn: () =>
      walletPort
        .request('requestChainForOrigin', { origin: originName })
        .then((chain) => createChain(chain)),
    useErrorBoundary: true,
  });
  const switchChainMutation = useMutation({
    mutationFn: (chain: string) =>
      walletPort.request('switchChainForOrigin', { chain, origin: originName }),
    useErrorBoundary: true,
    onSuccess: () => chainQuery.refetch(),
  });
  const { params } = useAddressParams();
  const { value: portfolioDecomposition } = useAddressPortfolioDecomposition({
    ...params,
    currency: 'usd',
  });
  const navigate = useNavigate();
  const handleAllRemoveSuccess = useCallback(() => {
    refetch();
    navigate(-1);
  }, [navigate, refetch]);

  const removeActionDialogRef = useRef<HTMLDialogElementInterface | null>(null);
  const selectNetworkDialogRef = useRef<HTMLDialogElementInterface | null>(
    null
  );
  const { data: currentWallet } = useQuery({
    queryKey: ['wallet/uiGetCurrentWallet'],
    queryFn: () => {
      return walletPort.request('uiGetCurrentWallet');
    },
  });
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
  const removePermissionMutation = useRemovePermissionMutation({
    onSuccess: () => {
      refetch();
      if (connectedSite?.addresses.length === 1) {
        navigate(-1);
      }
    },
  });
  const { setWalletNameFlags, isMetaMask } = useWalletNameFlags(originName);
  if (!connectedSite) {
    return <NotFoundPage />;
  }
  if (!siteChain || !currentWallet) {
    return null;
  }
  const title = getNameFromOrigin(connectedSite.origin);
  return (
    <>
      <BottomSheetDialog ref={removeActionDialogRef} style={{ height: '30vh' }}>
        <GenericPrompt message="The site will ask for permission next time" />
      </BottomSheetDialog>
      <NavigationTitle title={title} />
      <PageColumn>
        <Spacer height={16} />
        <VStack gap={24}>
          {!currentWalletIsConnected &&
          activeTabOrigin === connectedSite.origin ? (
            <VStack gap={4}>
              <ConnectToDappButton
                wallet={currentWallet}
                origin={connectedSite.origin}
                originTitle={title}
                onSuccess={() => {
                  navigate('/');
                }}
              />
              <UIText kind="small/regular" color="var(--neutral-500)">
                Connect {getWalletDisplayName(currentWallet)} to {title}. This
                will notify{' '}
                {connectedSiteOriginForHref ? (
                  <TextAnchor
                    href={connectedSiteOriginForHref.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: 'var(--primary)' }}
                  >
                    {title}
                  </TextAnchor>
                ) : (
                  <u>{title}</u>
                )}{' '}
                that your current address is connected, but it{apostrophe}s up
                to individual DApp to react to this event
              </UIText>
            </VStack>
          ) : null}
          <VStack gap={8}>
            <UIText kind="small/regular">Network</UIText>
            <SurfaceList
              items={[
                {
                  key: 0,
                  isInteractive: true,
                  pad: false,
                  component: (
                    <>
                      <BottomSheetDialog
                        ref={selectNetworkDialogRef}
                        style={{ padding: 0 }}
                      >
                        <NetworkSelectDialog
                          value={siteChain.toString()}
                          type="connection"
                          chainDistribution={portfolioDecomposition}
                        />
                      </BottomSheetDialog>

                      <SurfaceItemButton
                        onClick={() => {
                          if (selectNetworkDialogRef.current) {
                            showConfirmDialog(
                              selectNetworkDialogRef.current
                            ).then((value) => {
                              switchChainMutation.mutate(value);
                            });
                          }
                        }}
                      >
                        <CurrentNetworkSettingsItem chain={siteChain} />
                      </SurfaceItemButton>
                    </>
                  ),
                },
              ]}
            />
          </VStack>
          {connectedSite.wallets.length ? (
            <>
              <VStack gap={12}>
                <UIText kind="small/regular">
                  {connectedSiteOriginForHref ? (
                    <TextAnchor
                      href={connectedSiteOriginForHref.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: 'var(--primary)' }}
                    >
                      {capitalize(title)}
                    </TextAnchor>
                  ) : (
                    <u>{capitalize(title)}</u>
                  )}{' '}
                  can read these addresses:
                </UIText>
                <SurfaceList
                  items={connectedSite.wallets.map((wallet) => {
                    return {
                      key: wallet.address,
                      component: (
                        <HStack
                          gap={4}
                          justifyContent="space-between"
                          alignItems="center"
                        >
                          <Media
                            image={
                              <WalletAvatar
                                address={wallet.address}
                                active={false}
                                size={24}
                                borderRadius={4}
                              />
                            }
                            text={
                              <UIText
                                kind="body/regular"
                                style={{ wordBreak: 'break-all' }}
                              >
                                <WalletDisplayName wallet={wallet} />
                              </UIText>
                            }
                            detailText={
                              wallet.name ? (
                                <UIText
                                  kind="caption/regular"
                                  color="var(--neutral-500)"
                                >
                                  {truncateAddress(wallet.address)}
                                </UIText>
                              ) : null
                            }
                          />
                          <Button
                            kind="ghost"
                            size={28}
                            onClick={() => {
                              if (removeActionDialogRef.current) {
                                showConfirmDialog(
                                  removeActionDialogRef.current
                                ).then(() => {
                                  removePermissionMutation.mutate({
                                    origin: connectedSite.origin,
                                    address: wallet.address,
                                  });
                                });
                              }
                            }}
                            style={{
                              color: 'var(--negative-500)',
                              fontWeight: 'normal',
                            }}
                          >
                            Revoke
                          </Button>
                        </HStack>
                      ),
                    };
                  })}
                />
              </VStack>
              <SurfaceList
                items={[
                  {
                    key: 0,
                    isInteractive: true,
                    pad: false,
                    component: (
                      <RevokeAllSurfaceItemButton
                        origin={connectedSite.origin}
                        onSuccess={handleAllRemoveSuccess}
                      />
                    ),
                  },
                ]}
              />
            </>
          ) : null}
          <VStack gap={8}>
            <UIText kind="small/regular">Advanced</UIText>
            <SurfaceList
              items={[
                {
                  key: 0,
                  component: (
                    <HStack
                      gap={4}
                      justifyContent="space-between"
                      alignItems="center"
                    >
                      <UIText kind="small/regular">MetaMask Mode</UIText>
                      <Toggle
                        checked={isMetaMask}
                        onChange={(event) => {
                          setWalletNameFlags
                            .mutateAsync({
                              flag: WalletNameFlag.isMetaMask,
                              checked: event.target.checked,
                            })
                            .then(() => {
                              if (activeTabOrigin === originName) {
                                reloadActiveTab();
                              }
                            });
                        }}
                      />
                    </HStack>
                  ),
                },
              ]}
            />
            <UIText kind="caption/regular" color="var(--neutral-500)">
              Some DApps only work with MetaMask. Zerion Wallet can work with
              them by appearing as MetaMask
            </UIText>
          </VStack>
        </VStack>
        <PageBottom />
      </PageColumn>
    </>
  );
}
