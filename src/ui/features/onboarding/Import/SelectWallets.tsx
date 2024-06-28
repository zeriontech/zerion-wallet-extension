import React, { useCallback, useMemo, useState } from 'react';
import { Content } from 'react-area';
import { useQuery } from '@tanstack/react-query';
import groupBy from 'lodash/groupBy';
import { invariant } from 'src/shared/invariant';
import type { BareWallet } from 'src/shared/types/BareWallet';
import { getFirstNMnemonicWallets } from 'src/ui/pages/GetStarted/ImportWallet/MnemonicImportView/getFirstNMnemonicWallets';
import { normalizeAddress } from 'src/shared/normalizeAddress';
import { VStack } from 'src/ui/ui-kit/VStack';
import { UIText } from 'src/ui/ui-kit/UIText';
import { WalletList } from 'src/ui/pages/GetStarted/ImportWallet/MnemonicImportView/AddressImportFlow/WalletList';
import { PortfolioValueDetail } from 'src/ui/pages/GetStarted/ImportWallet/MnemonicImportView/AddressImportFlow/AddressImportFlow';
import { Button } from 'src/ui/ui-kit/Button';
import { wait } from 'src/shared/wait';
import { useAllExistingMnemonicAddresses } from 'src/ui/shared/requests/useAllExistingAddresses';
import { useAddressActivity } from 'src/ui/shared/requests/useAddressActivity';
import { useStaleTime } from 'src/ui/pages/GetStarted/ImportWallet/MnemonicImportView/useStaleTime';
import * as helperStyles from '../shared/helperStyles.module.css';
import { SelectWalletsFAQ } from '../FAQ';

export function SelectWallets({
  mnemonic,
  onSelect,
}: {
  mnemonic: string | null;
  onSelect(wallets: BareWallet[]): void;
}) {
  const [count] = useState(100);
  invariant(mnemonic, 'Seed phrase is empty');
  const [showInactiveWallets, setShowInactiveWallets] = useState(false);

  const { data: wallets, isLoading } = useQuery({
    queryKey: ['getFirstNMnemonicWallets', mnemonic, count],
    queryFn: async () => {
      await wait(1000);
      return getFirstNMnemonicWallets({ phrase: mnemonic, n: count });
    },
    useErrorBoundary: true,
    suspense: false,
  });

  const { value: activeWallets, isLoading: activeWalletsAreLoading } =
    useAddressActivity(
      { addresses: wallets?.map((w) => w.address) || [] },
      { enabled: Boolean(wallets), keepStaleData: true }
    );

  const { isStale: isStaleValue } = useStaleTime(activeWallets, 5000);
  const shouldWaitForValue = activeWallets == null && !isStaleValue;

  const grouped = groupBy(wallets, ({ address }) =>
    activeWallets?.[normalizeAddress(address)]?.active ? 'active' : 'rest'
  );
  const { active, rest } = grouped as Record<
    'active' | 'rest',
    BareWallet[] | undefined
  >;

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

  const existingAddresses = useAllExistingMnemonicAddresses();
  const existingAddressesSet = useMemo(
    () => new Set(existingAddresses),
    [existingAddresses]
  );

  return shouldWaitForValue && (isLoading || activeWalletsAreLoading) ? (
    <div className={helperStyles.loadingOverlay}>
      <UIText kind="headline/hero" className={helperStyles.loadingTitle}>
        Looking for Wallets
      </UIText>
    </div>
  ) : (
    <>
      <VStack gap={16}>
        <VStack gap={8}>
          <UIText kind="headline/h2">Select Wallets</UIText>
          <UIText kind="body/regular">
            Wallets associated with your recovery phrase.
          </UIText>
        </VStack>
        <VStack
          gap={6}
          style={{
            maxHeight: 500,
            overflow: 'auto',
            ['--surface-background-color' as string]: 'none',
          }}
        >
          {active ? (
            <WalletList
              listTitle="Active wallets"
              wallets={active}
              renderDetail={(index) => (
                <PortfolioValueDetail address={active[index].address} />
              )}
              values={values}
              onSelect={toggleAddress}
              paddingInline={0}
              existingAddressesSet={existingAddressesSet}
            />
          ) : null}
          {rest ? (
            showInactiveWallets || !active?.length ? (
              <WalletList
                listTitle={active?.length ? 'Inactive wallets' : null}
                wallets={rest}
                renderDetail={null}
                values={values}
                onSelect={toggleAddress}
                initialCount={3}
                paddingInline={0}
                existingAddressesSet={existingAddressesSet}
              />
            ) : (
              <Button
                size={40}
                kind="regular"
                onClick={() => setShowInactiveWallets(true)}
              >
                Show Inactive Wallets
              </Button>
            )
          ) : null}
        </VStack>
        <Button
          disabled={values.size === 0}
          onClick={() => {
            const selectedWallets = wallets?.filter((wallet) =>
              values.has(wallet.address)
            );
            if (selectedWallets) {
              onSelect(selectedWallets);
            }
          }}
        >
          Continue{values.size ? ` (${values.size})` : null}
        </Button>
      </VStack>
      <Content name="onboarding-faq">
        <SelectWalletsFAQ />
      </Content>
    </>
  );
}
