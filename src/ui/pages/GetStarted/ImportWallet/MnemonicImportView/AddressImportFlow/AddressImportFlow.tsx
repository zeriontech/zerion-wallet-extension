import groupBy from 'lodash/groupBy';
import React from 'react';
import { useCallback, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { normalizeAddress } from 'src/shared/normalizeAddress';
import type { BareWallet } from 'src/shared/types/BareWallet';
import { PageBottom } from 'src/ui/components/PageBottom';
import { PageColumn } from 'src/ui/components/PageColumn';
import { PageStickyFooter } from 'src/ui/components/PageStickyFooter';
import { PageTop } from 'src/ui/components/PageTop';
import { walletPort } from 'src/ui/shared/channels';
import { Button } from 'src/ui/ui-kit/Button';
import { UIText } from 'src/ui/ui-kit/UIText';
import { VStack } from 'src/ui/ui-kit/VStack';
import { AddressImportMessages } from './AddressImportMessages';
import { WalletList } from './WalletList';

function useAllExistingAddresses() {
  const { data: walletGroups } = useQuery(
    'wallet/uiGetWalletGroups',
    () => walletPort.request('uiGetWalletGroups'),
    { useErrorBoundary: true }
  );
  return useMemo(
    () =>
      walletGroups
        ?.flatMap((group) => group.walletContainer.wallets)
        .map(({ address }) => normalizeAddress(address)),
    [walletGroups]
  );
}

function AddressImportList({
  wallets,
  activeWallets,
  onSubmit,
}: {
  wallets: BareWallet[];
  activeWallets: Record<string, { active: boolean }>;
  onSubmit: (values: BareWallet[]) => void;
}) {
  const grouped = groupBy(wallets, ({ address }) =>
    activeWallets[normalizeAddress(address)]?.active ? 'active' : 'rest'
  );
  const { active, rest } = grouped as Record<
    'active' | 'rest',
    BareWallet[] | undefined
  >;
  const existingAddresses = useAllExistingAddresses();
  const existingAddressesSet = useMemo(
    () => new Set(existingAddresses),
    [existingAddresses]
  );
  const [values, setValue] = useState<Set<string>>(() => new Set());
  const toggleAddress = useCallback((value: string) => {
    setValue((set) => {
      const newSet = new Set(set);
      if (newSet.has(value)) {
        newSet.delete(value);
        return newSet;
      } else {
        return newSet.add(value);
      }
    });
  }, []);
  return (
    <>
      <PageColumn>
        <PageTop />
        <VStack gap={8}>
          <UIText kind="body/regular">
            We found these wallets associated with your recovery phrase
          </UIText>
          <VStack gap={20}>
            {active ? (
              <WalletList
                listTitle="Active wallets"
                wallets={active}
                showPortfolio={true}
                existingAddressesSet={existingAddressesSet}
                values={values}
                onSelect={toggleAddress}
              />
            ) : null}
            {rest ? (
              <WalletList
                listTitle="Inactive wallets"
                wallets={rest}
                showPortfolio={false}
                existingAddressesSet={existingAddressesSet}
                values={values}
                onSelect={toggleAddress}
                initialCount={active?.length ? 0 : 3}
              />
            ) : null}
          </VStack>
        </VStack>
        <PageBottom />
      </PageColumn>

      <PageStickyFooter lineColor="var(--neutral-300)">
        <VStack
          style={{
            marginTop: 8,
            textAlign: 'center',
          }}
          gap={8}
        >
          <Button
            disabled={values.size === 0}
            onClick={() => {
              const selectedWallets = wallets.filter((wallet) =>
                values.has(wallet.address)
              );
              onSubmit(selectedWallets);
            }}
          >
            Continue{values.size ? ` (${values.size})` : null}
          </Button>
        </VStack>
        <PageBottom />
      </PageStickyFooter>
    </>
  );
}

export function AddressImportFlow({
  wallets,
  activeWallets,
}: {
  wallets: BareWallet[];
  activeWallets: Record<string, { active: boolean }>;
}) {
  const [valuesToImport, setValuesToImport] = useState<BareWallet[]>();
  return valuesToImport ? (
    <AddressImportMessages values={valuesToImport} />
  ) : (
    <AddressImportList
      wallets={wallets}
      activeWallets={activeWallets}
      onSubmit={(values) => setValuesToImport(values)}
    />
  );
}
