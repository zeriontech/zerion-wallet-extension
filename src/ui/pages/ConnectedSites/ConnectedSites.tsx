import React, { useMemo, useRef, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Route, Routes } from 'react-router-dom';
import { PageBottom } from 'src/ui/components/PageBottom';
import { PageColumn } from 'src/ui/components/PageColumn';
import { walletPort } from 'src/ui/shared/channels';
import { HStack } from 'src/ui/ui-kit/HStack';
import { SurfaceList } from 'src/ui/ui-kit/SurfaceList';
import { UIText } from 'src/ui/ui-kit/UIText';
import ChevronRightIcon from 'jsx:src/ui/assets/chevron-right.svg';
import { AddressBadge } from 'src/ui/components/AddressBadge';
import { Media } from 'src/ui/ui-kit/Media';
import { VStack } from 'src/ui/ui-kit/VStack';
import { BottomSheetDialog } from 'src/ui/ui-kit/ModalDialogs/BottomSheetDialog';
import type { HTMLDialogElementInterface } from 'src/ui/ui-kit/ModalDialogs/HTMLDialogElementInterface';
import { showConfirmDialog } from 'src/ui/ui-kit/ModalDialogs/showConfirmDialog';
import { GenericPrompt } from 'src/ui/components/GenericPrompt';
import type { ConnectedSiteItem } from 'src/ui/shared/requests/getPermissionsWithWallets';
import { getPermissionsWithWallets } from 'src/ui/shared/requests/getPermissionsWithWallets';
import { ViewSuspense } from 'src/ui/components/ViewSuspense';
import { SiteFaviconImg } from 'src/ui/components/SiteFaviconImg';
import { SearchInput } from 'src/ui/ui-kit/Input/SearchInput';
import * as helperStyles from 'src/ui/style/helpers.module.css';
import { UnstyledButton } from 'src/ui/ui-kit/UnstyledButton';
import { PageTop } from 'src/ui/components/PageTop';
import { Spacer } from 'src/ui/ui-kit/Spacer';
import { FillView } from 'src/ui/components/FillView';
import type { InputHandle } from 'src/ui/ui-kit/Input/DebouncedInput';
import { DebouncedInput } from 'src/ui/ui-kit/Input/DebouncedInput';
import { ConnectedSite } from './ConnectedSite';

function RevokeAllPermissionsComponent({
  onRevokeAll,
}: {
  onRevokeAll: () => void;
}) {
  const removeAllOriginsMutation = useMutation({
    mutationFn: () => walletPort.request('removeAllOriginPermissions'),
    useErrorBoundary: true,
    onSuccess: onRevokeAll,
  });
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
                  : 'Disconnect All'}
              </UIText>
            ),
          },
        ]}
      />
    </>
  );
}

function ConnectedSitesList({
  showRevokeAll,
  items,
  onRevokeAll,
}: {
  showRevokeAll: boolean;
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
                  vGap={0}
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
                          size={16}
                          style={{
                            backgroundColor: 'transparent',
                            minWidth: index > 1 ? 0 : undefined,
                          }}
                          captionStyle={{ padding: 0 }}
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
      {showRevokeAll ? (
        <RevokeAllPermissionsComponent onRevokeAll={onRevokeAll} />
      ) : null}
    </VStack>
  );
}

function ConnectedSitesSearch({
  value,
  onChange,
  inputRef,
}: {
  value: string;
  onChange(value: string): void;
  inputRef: React.MutableRefObject<InputHandle | null>;
}) {
  return (
    <DebouncedInput
      ref={inputRef}
      value={value}
      delay={300}
      onChange={onChange}
      render={({ value, handleChange }) => (
        <SearchInput
          boxHeight={40}
          type="search"
          placeholder="Search"
          value={value}
          onChange={(event) => {
            handleChange(event.currentTarget.value);
          }}
        />
      )}
    />
  );
}

function EmptyView({
  hasConnectedSites,
  hasFilters,
  onReset,
}: {
  hasConnectedSites: boolean;
  hasFilters: boolean;
  onReset(): void;
}) {
  return (
    <FillView>
      {hasConnectedSites ? (
        <VStack gap={6} style={{ textAlign: 'center' }}>
          <UIText kind="headline/hero">🥺</UIText>
          <UIText kind="small/accent" color="var(--neutral-500)">
            <VStack gap={4}>
              <div>No connected DApps found</div>
              {hasFilters ? (
                <UnstyledButton
                  onClick={onReset}
                  style={{ color: 'var(--primary)' }}
                  className={helperStyles.hoverUnderline}
                >
                  Reset all filters
                </UnstyledButton>
              ) : null}
            </VStack>
          </UIText>
        </VStack>
      ) : (
        <UIText
          kind="body/regular"
          color="var(--neutral-500)"
          style={{ padding: 20, textAlign: 'center' }}
        >
          You will see a list of connected DApps here
        </UIText>
      )}
    </FillView>
  );
}

function ConnectedSitesMain() {
  const {
    data: allConnectedSites,
    isLoading,
    ...connectedSitesQuery
  } = useQuery({
    queryKey: ['getPermissionsWithWallets'],
    queryFn: getPermissionsWithWallets,
    useErrorBoundary: true,
    suspense: true,
  });
  const [searchQuery, setSearchQuery] = useState<string>('');
  const searchInputRef = useRef<InputHandle | null>(null);

  const itemsToDisplay = useMemo(() => {
    if (!searchQuery) {
      return allConnectedSites;
    }
    const query = searchQuery.trim();
    return allConnectedSites?.filter((site) =>
      site.origin.toLowerCase().includes(query)
    );
  }, [allConnectedSites, searchQuery]);

  return (
    <PageColumn>
      <PageTop />
      {allConnectedSites?.length ? (
        <>
          <ConnectedSitesSearch
            inputRef={searchInputRef}
            value={searchQuery}
            onChange={setSearchQuery}
          />
          <Spacer height={24} />
        </>
      ) : null}
      {isLoading ? null : itemsToDisplay?.length ? (
        <ConnectedSitesList
          showRevokeAll={!searchQuery}
          items={itemsToDisplay}
          onRevokeAll={() => connectedSitesQuery.refetch()}
        />
      ) : (
        <EmptyView
          hasConnectedSites={Boolean(allConnectedSites?.length)}
          hasFilters={Boolean(searchQuery)}
          onReset={() => {
            if (searchInputRef.current) {
              searchInputRef.current.setValue('');
            }
            setSearchQuery('');
          }}
        />
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
