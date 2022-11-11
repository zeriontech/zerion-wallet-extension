import React, { useMemo } from 'react';
import { useQuery } from 'react-query';
import groupBy from 'lodash/groupBy';
import { FillView } from 'src/ui/components/FillView';
import { PageColumn } from 'src/ui/components/PageColumn';
import { PageTop } from 'src/ui/components/PageTop';
import { walletPort } from 'src/ui/shared/channels';
import { SurfaceList } from 'src/ui/ui-kit/SurfaceList';
import { UIText } from 'src/ui/ui-kit/UIText';
import { VStack } from 'src/ui/ui-kit/VStack';
import type { WalletGroup } from 'src/shared/types/WalletGroup';
import { SeedType } from 'src/shared/SeedType';
import { HStack } from 'src/ui/ui-kit/HStack';
import { BlockieImg } from 'src/ui/components/BlockieImg';
import { AddressBadge } from 'src/ui/components/AddressBadge';
import { Route, Routes } from 'react-router-dom';
import ChevronRightIcon from 'jsx:src/ui/assets/chevron-right.svg';
import { getGroupDisplayName } from 'src/ui/shared/getGroupDisplayName';
import { WalletDisplayName } from 'src/ui/components/WalletDisplayName';
import { PageBottom } from 'src/ui/components/PageBottom';
import { WarningIcon } from 'src/ui/components/WarningIcon';
import { WalletAccount as WalletAccountPage } from './WalletAccount';
import { WalletGroup as WalletGroupPage } from './WalletGroup';

function PrivateKeyList({ walletGroups }: { walletGroups: WalletGroup[] }) {
  return (
    <VStack gap={8}>
      <UIText kind="subtitle/m_reg" color="var(--neutral-500)">
        Imported by Private Key (i)
      </UIText>

      <SurfaceList
        items={walletGroups.map((group) => {
          const wallet = group.walletContainer.wallets[0];
          const { address } = wallet;
          return {
            key: group.id,
            to: `/wallets/accounts/${wallet.address}`,
            component: (
              <HStack
                gap={4}
                justifyContent="space-between"
                alignItems="center"
              >
                <HStack gap={8} alignItems="center">
                  <BlockieImg address={address} size={28} />
                  <UIText kind="subtitle/m_reg" title={address}>
                    <WalletDisplayName wallet={wallet} />
                  </UIText>
                </HStack>
                <span>
                  <ChevronRightIcon />
                </span>
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
      <UIText kind="subtitle/m_reg" color="var(--neutral-500)">
        Wallets (i)
      </UIText>

      <SurfaceList
        items={walletGroups.map((group) => ({
          key: group.id,
          to: `/wallets/groups/${group.id}`,
          component: (
            <HStack gap={4} justifyContent="space-between" alignItems="center">
              <VStack gap={8}>
                <UIText
                  kind="subtitle/m_med"
                  style={{ wordBreak: 'break-all' }}
                >
                  {getGroupDisplayName(group.name)}
                </UIText>
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  {group.walletContainer.wallets.map((wallet) => (
                    <AddressBadge key={wallet.address} wallet={wallet} />
                  ))}
                </div>

                {group.lastBackedUp != null ? (
                  <UIText kind="caption/reg" color="var(--neutral-500)">
                    Last Backup:{' '}
                    {new Intl.DateTimeFormat('en', {
                      dateStyle: 'medium',
                    }).format(group.lastBackedUp)}
                  </UIText>
                ) : (
                  <HStack gap={4}>
                    <WarningIcon />
                    <UIText kind="caption/reg" color="var(--notice-500)">
                      Never backed up
                    </UIText>
                  </HStack>
                )}
              </VStack>
              <span>
                <ChevronRightIcon />
              </span>
            </HStack>
          ),
        }))}
      />
    </VStack>
  );
}

function WalletGroups() {
  const { data: walletGroups, isLoading } = useQuery(
    'wallet/uiGetWalletGroups',
    () => walletPort.request('uiGetWalletGroups'),
    { useErrorBoundary: true }
  );
  const groupedBySeedType = useMemo(() => {
    if (!walletGroups) {
      return null;
    }
    const grouped = groupBy(
      walletGroups,
      (group) => group.walletContainer.seedType
    );
    // Display mnemonic group first, privateKey second
    return [SeedType.mnemonic, SeedType.privateKey]
      .filter((seedType) => grouped[seedType])
      .map((seedType) => [seedType, grouped[seedType]]) as Array<
      [SeedType, typeof grouped['string']]
    >;
  }, [walletGroups]);
  if (isLoading) {
    return null;
  }
  return (
    <PageColumn>
      {groupedBySeedType == null ? (
        <FillView>
          <UIText kind="h/5_reg" color="var(--neutral-500)">
            Empty State
          </UIText>
        </FillView>
      ) : (
        <>
          <PageTop />
          <VStack gap={24}>
            {groupedBySeedType.map(([seedType, items]) => {
              if (seedType === SeedType.privateKey) {
                return <PrivateKeyList key={seedType} walletGroups={items} />;
              } else if (seedType === SeedType.mnemonic) {
                return <MnemonicList key={seedType} walletGroups={items} />;
              } else {
                return <div>Unknown seed type</div>;
              }
            })}
            <SurfaceList
              items={[
                {
                  key: 0,
                  to: '/get-started',
                  component: (
                    <UIText kind="body/s_reg" color="var(--primary)">
                      Create New Wallet
                    </UIText>
                  ),
                },
                {
                  key: 1,
                  to: '/get-started/import',
                  component: (
                    <UIText kind="body/s_reg" color="var(--primary)">
                      Import Wallet to Zerion
                    </UIText>
                  ),
                },
              ]}
            />
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
