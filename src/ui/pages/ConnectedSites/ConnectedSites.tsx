import React, { useRef } from 'react';
import { useMutation, useQuery } from 'react-query';
import { Route, Routes } from 'react-router-dom';
import { PageBottom } from 'src/ui/components/PageBottom';
import { PageColumn } from 'src/ui/components/PageColumn';
import { walletPort } from 'src/ui/shared/channels';
import { HStack } from 'src/ui/ui-kit/HStack';
import { SurfaceList } from 'src/ui/ui-kit/SurfaceList';
import { UIText } from 'src/ui/ui-kit/UIText';
import ChevronRightIcon from 'jsx:src/ui/assets/chevron-right.svg';
import { FillView } from 'src/ui/components/FillView';
import { Spacer } from 'src/ui/ui-kit/Spacer';
import { AddressBadge } from 'src/ui/components/AddressBadge';
import { Media } from 'src/ui/ui-kit/Media';
import { VStack } from 'src/ui/ui-kit/VStack';
import { BottomSheetDialog } from 'src/ui/ui-kit/ModalDialogs/BottomSheetDialog';
import type { HTMLDialogElementInterface } from 'src/ui/ui-kit/ModalDialogs/HTMLDialogElementInterface';
import { showConfirmDialog } from 'src/ui/ui-kit/ModalDialogs/showConfirmDialog';
import { GenericPrompt } from 'src/ui/components/GenericPrompt';
import {
  ConnectedSiteItem,
  getPermissionsWithWallets,
} from 'src/ui/shared/requests/getPermissionsWithWallets';
import { ViewSuspense } from 'src/ui/components/ViewSuspense';
import { SiteFaviconImg } from 'src/ui/components/SiteFaviconImg';
import { ConnectedSite } from './ConnectedSite';

function RevokeAllPermissionsComponent({
  onRevokeAll,
}: {
  onRevokeAll: () => void;
}) {
  const removeAllOriginsMutation = useMutation(
    () => walletPort.request('removeAllOriginPermissions'),
    { useErrorBoundary: true, onSuccess: onRevokeAll }
  );
  const dialogRef = useRef<HTMLDialogElementInterface | null>(null);
  return (
    <>
      <BottomSheetDialog ref={dialogRef} style={{ height: '30vh' }}>
        <GenericPrompt message="The websites will no longer see your addresses, but they can request access again" />
      </BottomSheetDialog>
      <SurfaceList
        items={[
          {
            key: 0,
            onClick: () => {
              if (dialogRef.current) {
                showConfirmDialog(dialogRef.current).then(() => {
                  removeAllOriginsMutation.mutate();
                });
              }
            },
            component: (
              <UIText kind="body/regular" color="var(--negative-500)">
                {removeAllOriginsMutation.isLoading
                  ? 'Loading...'
                  : 'Revoke All'}
              </UIText>
            ),
          },
        ]}
      />
    </>
  );
}

function ConnectedSitesList({
  items,
  onRevokeAll,
}: {
  items: ConnectedSiteItem[];
  onRevokeAll: () => void;
}) {
  return (
    <VStack gap={24}>
      <SurfaceList
        items={items.map((item) => {
          const alt = `Logo for ${item.origin}`;
          return {
            key: item.origin,
            to: `/connected-sites/${encodeURIComponent(item.origin)}`,
            component: (
              <HStack
                gap={4}
                justifyContent="space-between"
                alignItems="center"
              >
                <Media
                  image={
                    <div>
                      <SiteFaviconImg
                        size={16}
                        style={{
                          /* maxWidth, maxHeight and overflow hidden are required to avoid jumping at img onError */
                          maxWidth: 16,
                          maxHeight: 16,
                          overflow: 'hidden',
                        }}
                        url={item.origin}
                        alt={alt}
                      />
                    </div>
                  }
                  text={
                    <UIText kind="body/accent">
                      {new URL(item.origin).hostname}
                    </UIText>
                  }
                  detailText={
                    <div
                      style={{
                        display: 'flex',
                        gap: 8,
                        overflow: 'hidden',
                        whiteSpace: 'nowrap',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {item.wallets.slice(0, 3).map((wallet, index) => (
                        <AddressBadge
                          key={wallet.address}
                          wallet={wallet}
                          style={{
                            padding: 0,
                            backgroundColor: 'transparent',
                            minWidth: index > 1 ? 0 : undefined,
                          }}
                        />
                      ))}
                    </div>
                  }
                />

                <ChevronRightIcon />
              </HStack>
            ),
          };
        })}
      />
      <RevokeAllPermissionsComponent onRevokeAll={onRevokeAll} />
    </VStack>
  );
}

function ConnectedSitesMain() {
  const { data: connectedSites, ...connectedSitesQuery } = useQuery(
    'getPermissionsWithWallets',
    getPermissionsWithWallets,
    { useErrorBoundary: true, suspense: true }
  );

  if (connectedSitesQuery.isLoading) {
    return <p>Loading qweasd...</p>;
  }

  return (
    <PageColumn>
      {connectedSites?.length ? (
        <>
          <Spacer height={16} />
          <ConnectedSitesList
            items={connectedSites}
            onRevokeAll={() => connectedSitesQuery.refetch()}
          />
        </>
      ) : (
        <FillView>
          <UIText
            kind="body/regular"
            color="var(--neutral-500)"
            style={{ padding: 20, textAlign: 'center' }}
          >
            You will see a list of connected DApps here
          </UIText>
        </FillView>
      )}
      <PageBottom />
    </PageColumn>
  );
}

export function ConnectedSites() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <ViewSuspense>
            <ConnectedSitesMain />
          </ViewSuspense>
        }
      />
      <Route
        path="/:originName"
        element={
          <ViewSuspense>
            <ConnectedSite />
          </ViewSuspense>
        }
      />
    </Routes>
  );
}
