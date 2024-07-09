import groupBy from 'lodash/groupBy';
import React from 'react';
import { useCallback, useMemo, useState } from 'react';
import { normalizeAddress } from 'src/shared/normalizeAddress';
import type { BareWallet } from 'src/shared/types/BareWallet';
import { PageBottom } from 'src/ui/components/PageBottom';
import { PageColumn } from 'src/ui/components/PageColumn';
import { PageStickyFooter } from 'src/ui/components/PageStickyFooter';
import { PageTop } from 'src/ui/components/PageTop';
import { Button } from 'src/ui/ui-kit/Button';
import { UIText } from 'src/ui/ui-kit/UIText';
import { VStack } from 'src/ui/ui-kit/VStack';
import { PortfolioValue } from 'src/ui/shared/requests/PortfolioValue';
import { NeutralDecimals } from 'src/ui/ui-kit/NeutralDecimals';
import { formatCurrencyToParts } from 'src/shared/units/formatCurrencyValue';
import { NBSP } from 'src/ui/shared/typography';
import { useAllExistingMnemonicAddresses } from 'src/ui/shared/requests/useAllExistingAddresses';
import { Spacer } from 'src/ui/ui-kit/Spacer';
import { useCurrency } from 'src/modules/currency/useCurrency';
import { AddressImportMessages } from './AddressImportMessages';
import { WalletList } from './WalletList';

export function PortfolioValueDetail({ address }: { address: string }) {
  const { currency } = useCurrency();

  return (
    <UIText kind="headline/h2">
      <PortfolioValue
        address={address}
        render={({ value }) =>
          value ? (
            <NeutralDecimals
              parts={formatCurrencyToParts(value.total_value, 'en', currency)}
            />
          ) : (
            <span>{NBSP}</span>
          )
        }
      />
    </UIText>
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
  const existingAddresses = useAllExistingMnemonicAddresses();
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
                renderDetail={(index) => (
                  <PortfolioValueDetail address={active[index].address} />
                )}
                existingAddressesSet={existingAddressesSet}
                values={values}
                onSelect={toggleAddress}
              />
            ) : null}
            {rest ? (
              <WalletList
                listTitle="Inactive wallets"
                wallets={rest}
                renderDetail={null}
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
        <Spacer height={8} />
        <VStack style={{ textAlign: 'center' }} gap={8}>
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
