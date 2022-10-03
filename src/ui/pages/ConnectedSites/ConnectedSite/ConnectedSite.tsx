import React, { useCallback, useMemo, useRef } from 'react';
import { capitalize } from 'capitalize-ts';
import { useMutation, useQuery } from 'react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { NavigationTitle } from 'src/ui/components/NavigationTitle';
import { NotFoundPage } from 'src/ui/components/NotFoundPage';
import { PageColumn } from 'src/ui/components/PageColumn';
import { getPermissionsWithWallets } from 'src/ui/shared/requests/getPermissionsWithWallets';
import { Spacer } from 'src/ui/ui-kit/Spacer';
import { TextAnchor } from 'src/ui/ui-kit/TextAnchor';
import { UIText } from 'src/ui/ui-kit/UIText';
import { VStack } from 'src/ui/ui-kit/VStack';
import { SurfaceList, SurfaceItemButton } from 'src/ui/ui-kit/SurfaceList';
import { HStack } from 'src/ui/ui-kit/HStack';
import { Media } from 'src/ui/ui-kit/Media';
import { WalletIcon } from 'src/ui/ui-kit/WalletIcon';
import { WalletDisplayName } from 'src/ui/components/WalletDisplayName';
import { truncateAddress } from 'src/ui/shared/truncateAddress';
import { Button } from 'src/ui/ui-kit/Button';
import { PageBottom } from 'src/ui/components/PageBottom';
import { BottomSheetDialog } from 'src/ui/ui-kit/ModalDialogs/BottomSheetDialog';
import { GenericPrompt } from 'src/ui/components/GenericPrompt';
import type { HTMLDialogElementInterface } from 'src/ui/ui-kit/ModalDialogs/HTMLDialogElementInterface';
import { showConfirmDialog } from 'src/ui/ui-kit/ModalDialogs/showConfirmDialog';
import { walletPort } from 'src/ui/shared/channels';
import { CurrentNetworkSettingsItem } from '../../Networks/CurrentNetworkSettingsItem';
import { createChain } from 'src/modules/networks/Chain';
import { NetworkSelectDialog } from 'src/ui/components/NetworkSelectDialog';
import { CenteredDialog } from 'src/ui/ui-kit/ModalDialogs/CenteredDialog';
import { DialogTitle } from 'src/ui/ui-kit/ModalDialogs/DialogTitle';

function useRemovePermissionMutation({ onSuccess }: { onSuccess: () => void }) {
  return useMutation(
    ({ origin, address }: { origin: string; address?: string }) => {
      return walletPort.request('removePermission', { origin, address });
    },
    { onSuccess }
  );
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
      <BottomSheetDialog ref={removeActionDialogRef}>
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
        <UIText kind="body/s_reg" color="var(--negative-500)">
          {removePermissionMutation.isLoading ? 'Loading...' : 'Revoke All'}
        </UIText>
      </SurfaceItemButton>
    </>
  );
}

export function ConnectedSite() {
  const { originName } = useParams();
  if (!originName) {
    throw new Error('originName parameter is required for this view');
  }
  const { data: connectedSites, refetch } = useQuery(
    'getPermissionsWithWallets',
    getPermissionsWithWallets,
    { useErrorBoundary: true, suspense: true }
  );
  const connectedSite = useMemo(
    () => connectedSites?.find((site) => site.origin === originName),
    [connectedSites, originName]
  );
  const { data: siteChain, ...chainQuery } = useQuery(
    `wallet/requestChainForOrigin(${originName})`,
    () =>
      walletPort
        .request('requestChainForOrigin', { origin: originName })
        .then((chain) => createChain(chain)),
    { useErrorBoundary: true, suspense: true }
  );
  const switchChainMutation = useMutation(
    (chain: string) =>
      walletPort.request('switchChainForOrigin', { chain, origin: originName }),
    { useErrorBoundary: true, onSuccess: () => chainQuery.refetch() }
  );
  const navigate = useNavigate();
  const handleAllRemoveSuccess = useCallback(() => {
    refetch();
    navigate(-1);
  }, [navigate, refetch]);

  const removeActionDialogRef = useRef<HTMLDialogElementInterface | null>(null);
  const selectNetworkDialogRef = useRef<HTMLDialogElementInterface | null>(
    null
  );
  const removePermissionMutation = useRemovePermissionMutation({
    onSuccess: () => {
      refetch();
      if (connectedSite?.addresses.length === 1) {
        navigate(-1);
      }
    },
  });
  if (!connectedSite) {
    return <NotFoundPage />;
  }
  if (!siteChain) {
    return null;
  }
  const title = new URL(connectedSite.origin).hostname;
  return (
    <>
      <BottomSheetDialog ref={removeActionDialogRef}>
        <GenericPrompt message="The site will ask for permission next time" />
      </BottomSheetDialog>
      <NavigationTitle title={title} />
      <PageColumn>
        <Spacer height={16} />
        <VStack gap={24}>
          <VStack gap={8}>
            <UIText kind="subtitle/m_reg">Network</UIText>
            <SurfaceList
              items={[
                {
                  key: 0,
                  isInteractive: true,
                  pad: false,
                  component: (
                    <>
                      <CenteredDialog ref={selectNetworkDialogRef}>
                        <DialogTitle
                          title={
                            <UIText kind="subtitle/m_med">
                              Network for {new URL(originName).hostname}
                            </UIText>
                          }
                        />
                        <NetworkSelectDialog value={siteChain.toString()} />
                      </CenteredDialog>

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
                <UIText kind="subtitle/m_reg">
                  <TextAnchor
                    href={connectedSite.origin}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: 'var(--primary)' }}
                  >
                    {capitalize(title)}
                  </TextAnchor>{' '}
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
                              <WalletIcon
                                address={wallet.address}
                                active={false}
                                iconSize={24}
                              />
                            }
                            text={
                              <UIText
                                kind="body/s_reg"
                                style={{ wordBreak: 'break-all' }}
                              >
                                <WalletDisplayName wallet={wallet} />
                              </UIText>
                            }
                            detailText={
                              wallet.name ? (
                                <UIText
                                  kind="caption/reg"
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
        </VStack>
        <PageBottom />
      </PageColumn>
    </>
  );
}
