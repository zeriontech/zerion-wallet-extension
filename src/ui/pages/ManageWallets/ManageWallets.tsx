import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import groupBy from 'lodash/groupBy';
import { capitalize } from 'capitalize-ts';
import { FillView } from 'src/ui/components/FillView';
import { PageColumn } from 'src/ui/components/PageColumn';
import { PageTop } from 'src/ui/components/PageTop';
import { walletPort } from 'src/ui/shared/channels';
import { SurfaceList } from 'src/ui/ui-kit/SurfaceList';
import { UIText } from 'src/ui/ui-kit/UIText';
import { VStack } from 'src/ui/ui-kit/VStack';
import type { WalletGroup } from 'src/shared/types/WalletGroup';
import { HStack } from 'src/ui/ui-kit/HStack';
import { AddressBadge } from 'src/ui/components/AddressBadge';
import { Navigate, Route, Routes } from 'react-router-dom';
import ChevronRightIcon from 'jsx:src/ui/assets/chevron-right.svg';
import { getGroupDisplayName } from 'src/ui/shared/getGroupDisplayName';
import { WalletDisplayName } from 'src/ui/components/WalletDisplayName';
import { PageBottom } from 'src/ui/components/PageBottom';
import { EraseDataListButton } from 'src/ui/components/EraseData';
import { WalletAvatar } from 'src/ui/components/WalletAvatar';
import { BackupInfoNote } from 'src/ui/components/BackupInfoNote';
import {
  ContainerType,
  getContainerType,
  isHardwareContainer,
} from 'src/shared/types/validators';
import { openInTabView } from 'src/ui/shared/openInTabView';
import { NavigationTitle } from 'src/ui/components/NavigationTitle';
import { WalletAccount as WalletAccountPage } from './WalletAccount';
import { WalletGroup as WalletGroupPage } from './WalletGroup';

function FlatAddressList({
  walletGroups,
  title,
}: {
  walletGroups: WalletGroup[];
  title: React.ReactNode;
}) {
  return (
    <VStack gap={8}>
      <UIText kind="small/accent" color="var(--neutral-500)">
        {title}
      </UIText>
      <SurfaceList
        items={walletGroups.map((group) => {
          const wallet = group.walletContainer.wallets[0];
          const { address } = wallet;
          return {
            key: group.id,
            to: `/wallets/accounts/${wallet.address}?groupId=${group.id}`,
            component: (
              <HStack
                gap={4}
                justifyContent="space-between"
                alignItems="center"
              >
                <HStack gap={8} alignItems="center">
                  <WalletAvatar address={address} size={28} borderRadius={4} />
                  <UIText kind="small/regular" title={address}>
                    <WalletDisplayName wallet={wallet} />
                  </UIText>
                </HStack>
                <ChevronRightIcon style={{ color: 'var(--neutral-400)' }} />
              </HStack>
            ),
          };
        })}
      />
    </VStack>
  );
}

function MnemonicList({ walletGroups }: { walletGroups: WalletGroup[] }) {
  return (
    <VStack gap={8}>
      <UIText kind="small/accent" color="var(--neutral-500)">
        Wallets
      </UIText>

      <SurfaceList
        items={walletGroups.map((group) => ({
          key: group.id,
          separatorTop: true,
          to: `/wallets/groups/${group.id}`,
          component: (
            <HStack gap={4} justifyContent="space-between" alignItems="center">
              <VStack gap={8}>
                <UIText
                  kind="small/accent"
                  style={{ overflowWrap: 'break-word' }}
                >
                  {getGroupDisplayName(group.name)}
                </UIText>
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  {group.walletContainer.wallets.map((wallet) => (
                    <AddressBadge key={wallet.address} wallet={wallet} />
                  ))}
                </div>
                <BackupInfoNote group={group} />
              </VStack>
              <ChevronRightIcon style={{ color: 'var(--neutral-400)' }} />
            </HStack>
          ),
        }))}
      />
    </VStack>
  );
}

function HardwareWalletList({ walletGroups }: { walletGroups: WalletGroup[] }) {
  return (
    <VStack gap={8}>
      <UIText kind="small/regular" color="var(--neutral-500)">
        Hardware Wallets
      </UIText>

      <SurfaceList
        items={walletGroups.map((group) => ({
          key: group.id,
          separatorTop: true,
          to: `/wallets/groups/${group.id}`,
          component: (
            <HStack gap={4} justifyContent="space-between" alignItems="center">
              <VStack gap={8}>
                <VStack gap={0}>
                  <UIText
                    kind="small/accent"
                    style={{ wordBreak: 'break-all' }}
                  >
                    {getGroupDisplayName(group.name)}
                  </UIText>
                  {isHardwareContainer(group.walletContainer) ? (
                    <UIText kind="caption/regular" color="var(--neutral-500)">
                      {capitalize(group.walletContainer.provider)}
                      {' · '}
                      {group.walletContainer.device.productName}
                    </UIText>
                  ) : null}
                </VStack>
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  {group.walletContainer.wallets.map((wallet) => (
                    <AddressBadge key={wallet.address} wallet={wallet} />
                  ))}
                </div>
                <BackupInfoNote group={group} />
              </VStack>
              <ChevronRightIcon style={{ color: 'var(--neutral-400)' }} />
            </HStack>
          ),
        }))}
      />
    </VStack>
  );
}

function WalletGroups() {
  const { data: walletGroups, isLoading } = useQuery({
    queryKey: ['wallet/uiGetWalletGroups'],
    queryFn: () => walletPort.request('uiGetWalletGroups'),
    useErrorBoundary: true,
  });
  const groupedBySeedType = useMemo(() => {
    if (!walletGroups) {
      return null;
    }
    const grouped = groupBy(walletGroups, (group) =>
      getContainerType(group.walletContainer)
    );
    // Define order of groups
    return [
      ContainerType.mnemonic,
      ContainerType.privateKey,
      ContainerType.hardware,
      ContainerType.readonly,
    ]
      .filter((containerType) => grouped[containerType])
      .map((containerType) => [containerType, grouped[containerType]]) as Array<
      [ContainerType, (typeof grouped)['string']]
    >;
  }, [walletGroups]);

  if (isLoading) {
    return null;
  }

  if (!walletGroups?.length) {
    return <Navigate to="/get-started?intro" replace={true} />;
  }

  return (
    <PageColumn>
      <NavigationTitle title="Manage Wallets" />
      {groupedBySeedType == null ? (
        <FillView>
          <UIText kind="headline/h2" color="var(--neutral-500)">
            Empty State
          </UIText>
        </FillView>
      ) : (
        <>
          <PageTop />
          <VStack gap={16}>
            {groupedBySeedType.map(([containerType, items]) => {
              if (containerType === ContainerType.privateKey) {
                return (
                  <FlatAddressList
                    key={containerType}
                    walletGroups={items}
                    title="Imported by Private Key"
                  />
                );
              } else if (containerType === ContainerType.mnemonic) {
                return (
                  <MnemonicList key={containerType} walletGroups={items} />
                );
              } else if (containerType === ContainerType.hardware) {
                return (
                  <HardwareWalletList
                    key={containerType}
                    walletGroups={items}
                  />
                );
              } else if (containerType === ContainerType.readonly) {
                return (
                  <FlatAddressList
                    key={containerType}
                    walletGroups={items}
                    title="Watchlist"
                  />
                );
              }
            })}
            <SurfaceList
              items={[
                {
                  key: 0,
                  to: '/get-started',
                  component: (
                    <UIText kind="body/accent" color="var(--primary)">
                      Create New Wallet
                    </UIText>
                  ),
                },
                {
                  key: 1,
                  to: '/get-started/import',
                  component: (
                    <UIText kind="body/accent" color="var(--primary)">
                      Import Wallet to Zerion
                    </UIText>
                  ),
                },
                {
                  key: 2,
                  to: '/connect-hardware-wallet',
                  onClick: openInTabView,
                  component: (
                    <UIText kind="body/accent" color="var(--primary)">
                      Connect Ledger
                    </UIText>
                  ),
                },
                {
                  key: 3,
                  to: '/get-started/readonly',
                  component: (
                    <UIText kind="body/accent" color="var(--primary)">
                      Add Watch Address
                    </UIText>
                  ),
                },
              ]}
            />
            <EraseDataListButton textKind="body/accent" />
          </VStack>
        </>
      )}
      <PageBottom />
    </PageColumn>
  );
}

export function ManageWallets() {
  return (
    <Routes>
      <Route path="/" element={<WalletGroups />} />
      <Route path="/groups/:groupId" element={<WalletGroupPage />} />
      <Route path="/accounts/:address" element={<WalletAccountPage />} />
    </Routes>
  );
}
