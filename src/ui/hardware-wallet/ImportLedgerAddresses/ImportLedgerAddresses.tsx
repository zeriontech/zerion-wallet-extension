import React, { useCallback, useMemo, useState } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { getAddresses } from '@zeriontech/hardware-wallet-connection';
import type { DeviceAccount } from 'src/shared/types/Device';
import {
  SegmentedControlGroup,
  SegmentedControlRadio,
} from 'src/ui/ui-kit/SegmentedControl';
import type { DerivationPathType } from 'src/shared/wallet/derivation-paths';
import { WalletListPresentation } from 'src/ui/pages/GetStarted/ImportWallet/MnemonicImportView/AddressImportFlow/WalletList';
import { Button } from 'src/ui/ui-kit/Button';
import { invariant } from 'src/shared/invariant';
import { PageFullBleedColumn } from 'src/ui/components/PageFullBleedColumn';
import { PageColumn } from 'src/ui/components/PageColumn';
import { UIText } from 'src/ui/ui-kit/UIText';
import { Spacer } from 'src/ui/ui-kit/Spacer';
import type { DeviceConnection } from '../types';

function AddressSelectList({
  ledger,
  pathType,
  onImport,
  existingAddressesSet,
}: {
  pathType: DerivationPathType;
  ledger: DeviceConnection;
  existingAddressesSet: Set<string>;
  onImport: (values: DeviceAccount[]) => void;
}) {
  const { appEth } = ledger;
  const COUNT = 5;
  const { data, fetchNextPage, isFetchingNextPage } = useInfiniteQuery({
    queryKey: ['ledger/addresses', COUNT, pathType, appEth],
    queryKeyHashFn: (queryKey) => queryKey.filter((x) => x !== appEth).join(''),
    queryFn: async ({ pageParam = 0 }) => {
      return getAddresses(appEth, {
        type: pathType as 'ledger' | 'ledgerLive',
        from: pageParam,
        count: COUNT,
      });
    },
    getNextPageParam: (_lastPage, allPages) => {
      return allPages.reduce((sum, items) => sum + items.length, 0);
    },
    staleTime: Infinity, // addresses found on ledger will not change
  });
  const itemsByAddress = useMemo(
    () =>
      new Map(
        data?.pages.flatMap((items) =>
          items.map((item) => [item.account.address, item])
        )
      ),
    [data]
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
  if (!data) {
    return null;
  }
  return (
    <>
      <PageFullBleedColumn
        paddingInline={false}
        style={{
          flexGrow: 1,
          overflow: 'auto',
          ['--surface-background-color' as string]: 'var(--background)',
        }}
      >
        <WalletListPresentation
          values={values}
          derivationPathType={pathType}
          wallets={data.pages.flatMap((items) =>
            items.map((item) => ({
              address: item.account.address,
              name: null,
              privateKey: '<ledger-private-key>',
              mnemonic: {
                path: item.derivationPath,
                phrase: '<ledger-mnemonic>',
              },
            }))
          )}
          renderDetail={null}
          initialCount={COUNT}
          listTitle={null}
          onSelect={toggleAddress}
          existingAddressesSet={existingAddressesSet}
          hasMore={true} // ledger can derive infinite amount of addresses
          isLoadingMore={isFetchingNextPage}
          onLoadMore={() => {
            fetchNextPage();
          }}
        />
        <Spacer height={12} />
      </PageFullBleedColumn>
      <PageFullBleedColumn
        paddingInline={true}
        style={{
          position: 'sticky',
          bottom: 0,
          borderTop: '1px solid var(--neutral-300)',
          backgroundColor: 'var(--background)',
        }}
      >
        <Spacer height={24} />
        <Button
          style={{ width: '100%' }}
          kind="primary"
          disabled={values.size === 0}
          onClick={() => {
            onImport(
              Array.from(values).map((address) => {
                const item = itemsByAddress.get(address);
                invariant(item, `Record for ${address} not found`);
                return {
                  address,
                  name: null,
                  derivationPath: item.derivationPath,
                };
              })
            );
          }}
        >
          {'Continue' + (values.size ? ` (${values.size})` : '')}
        </Button>
        <Spacer height={24} />
      </PageFullBleedColumn>
    </>
  );
}

/** NOTE: We decided to only show ledger live addresses until users report feedback */
const LEDGER_LIVE_ONLY = true;

export function ImportLedgerAddresses({
  ledger,
  onImport,
  existingAddressesSet,
}: {
  ledger: DeviceConnection;
  existingAddressesSet: Set<string>;
  onImport: (values: DeviceAccount[]) => void;
}) {
  const [pathType, setPathType] = useState<DerivationPathType>('ledgerLive');
  return (
    <PageColumn style={{ height: '100%', position: 'relative' }}>
      <PageFullBleedColumn
        paddingInline={true}
        style={{
          position: 'sticky',
          top: 0,
          backgroundColor: 'var(--background)',
          zIndex: 1,
        }}
      >
        <UIText kind="headline/hero">Select Wallets</UIText>
        <Spacer height={24} />
      </PageFullBleedColumn>
      {LEDGER_LIVE_ONLY ? null : (
        <>
          <SegmentedControlGroup style={{ paddingTop: 4 }}>
            <SegmentedControlRadio
              name="pathType"
              value="ledger"
              checked={pathType === 'ledger'}
              onChange={(event) =>
                setPathType(event.currentTarget.value as DerivationPathType)
              }
            >
              Ledger
            </SegmentedControlRadio>
            <SegmentedControlRadio
              name="pathType"
              value="ledgerLive"
              checked={pathType === 'ledgerLive'}
              onChange={(event) =>
                setPathType(event.currentTarget.value as DerivationPathType)
              }
            >
              Ledger Live
            </SegmentedControlRadio>
          </SegmentedControlGroup>
          <Spacer height={24} />
        </>
      )}
      <AddressSelectList
        key={pathType}
        ledger={ledger}
        pathType={pathType}
        onImport={onImport}
        existingAddressesSet={existingAddressesSet}
      />
    </PageColumn>
  );
}
