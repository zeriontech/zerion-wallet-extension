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
import { AddressText } from 'src/ui/components/AddressText';
import { HStack } from 'src/ui/ui-kit/HStack';
import { BlockieImg } from 'src/ui/components/BlockieImg';
import { AddressBadge } from 'src/ui/components/AddressBadge';

function PrivateKeyList({ walletGroups }: { walletGroups: WalletGroup[] }) {
  return (
    <VStack gap={8}>
      <UIText kind="subtitle/m_reg" color="var(--neutral-500)">
        Imported by Private Key (i)
      </UIText>

      <SurfaceList
        items={walletGroups.map((group) => {
          const { address } = group.walletContainer.wallets[0];
          return {
            key: group.id,
            component: (
              <HStack gap={12}>
                <BlockieImg address={address} size={28} />
                <div>
                  <UIText kind="subtitle/l_reg" title={address}>
                    <AddressText address={address} />
                  </UIText>
                </div>
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
          component: (
            <VStack gap={4}>
              <UIText kind="subtitle/m_med">{group.name}</UIText>
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {group.walletContainer.wallets.map((wallet) => (
                  <AddressBadge key={wallet.address} address={wallet.address} />
                ))}
              </div>
            </VStack>
          ),
        }))}
      />
    </VStack>
  );
}
export function ManageWallets() {
  const { data: walletGroups, isLoading } = useQuery(
    'wallet/getWalletGroups',
    () => walletPort.request('getWalletGroups'),
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
                return <PrivateKeyList walletGroups={items} />;
              } else if (seedType === SeedType.mnemonic) {
                return <MnemonicList walletGroups={items} />;
              } else {
                return <div>Unknown seed type</div>;
              }
            })}
          </VStack>
        </>
      )}
    </PageColumn>
  );
}
