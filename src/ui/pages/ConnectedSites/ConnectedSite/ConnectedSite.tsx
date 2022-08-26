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
  const ref = useRef<HTMLDialogElementInterface | null>(null);

  return (
    <>
      <BottomSheetDialog ref={ref}>
        <GenericPrompt message="The site will ask for permission next time" />
      </BottomSheetDialog>
      <SurfaceItemButton
        onClick={() => {
          if (ref.current) {
            showConfirmDialog(ref.current).then(() => {
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
  const { data: connectedSites, refetch } = useQuery(
    'getPermissionsWithWallets',
    getPermissionsWithWallets,
    { useErrorBoundary: true, suspense: true }
  );
  const connectedSite = useMemo(
    () => connectedSites?.find((site) => site.origin === originName),
    [connectedSites, originName]
  );
  const navigate = useNavigate();
  const handleAllRemoveSuccess = useCallback(() => {
    refetch();
    navigate(-1);
  }, [navigate, refetch]);

  const ref = useRef<HTMLDialogElementInterface | null>(null);
  const removePermissionMutation = useRemovePermissionMutation({
    onSuccess: () => {
      console.log('useRemovePermissionMutation onSuccess', connectedSites);
      refetch();
      if (connectedSite?.addresses.length === 1) {
        navigate(-1);
      }
    },
  });
  if (!connectedSite) {
    return <NotFoundPage />;
  }
  const title = new URL(connectedSite.origin).hostname;
  return (
    <>
      <BottomSheetDialog ref={ref}>
        <GenericPrompt message="The site will ask for permission next time" />
      </BottomSheetDialog>
      <NavigationTitle title={title} />
      <PageColumn>
        <Spacer height={16} />
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
        <Spacer height={12} />
        <VStack gap={24}>
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
                          <UIText kind="caption/reg" color="var(--neutral-500)">
                            {truncateAddress(wallet.address)}
                          </UIText>
                        ) : null
                      }
                    />
                    <Button
                      kind="ghost"
                      size={28}
                      onClick={() => {
                        if (ref.current) {
                          showConfirmDialog(ref.current).then(() => {
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
                      Remove
                    </Button>
                  </HStack>
                ),
              };
            })}
          />
          <SurfaceList
            items={[
              {
                key: 0,
                isInteractive: true,
                component: (
                  <RevokeAllSurfaceItemButton
                    origin={connectedSite.origin}
                    onSuccess={handleAllRemoveSuccess}
                  />
                ),
              },
            ]}
          />
        </VStack>
        <PageBottom />
      </PageColumn>
    </>
  );
}
