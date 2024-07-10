import React, { useCallback, useMemo, useState } from 'react';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
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
import type { ExternallyOwnedAccount } from 'src/shared/types/ExternallyOwnedAccount';
import type { RpcRequest } from 'src/shared/custom-rpc';
import { Media } from 'src/ui/ui-kit/Media';
import { AvatarIcon } from 'src/ui/components/WalletAvatar/AvatarIcon';
import type { WalletInfo } from 'src/ui/pages/HardwareWalletConnection/shared/getWalletInfo';
import { NeutralDecimals } from 'src/ui/ui-kit/NeutralDecimals';
import { formatCurrencyToParts } from 'src/shared/units/formatCurrencyValue';
import { NBSP } from 'src/ui/shared/typography';
import { getWalletDisplayName } from 'src/ui/shared/getWalletDisplayName';
import type { DeviceConnection } from '../types';

type ControllerRequest = Omit<RpcRequest, 'id'>;

// We don't have access to preference-store inside iframe and can't use useCurrency hook
function getIframeCurrency() {
  const pageUrl = new URL(window.location.href);
  const currencyStateParam = pageUrl.searchParams.get('currency');
  invariant(currencyStateParam, 'currency param is requred');
  return currencyStateParam;
}

function WalletMediaPresentation({
  wallet,
  walletInfo,
}: {
  wallet: ExternallyOwnedAccount;
  walletInfo?: WalletInfo;
}) {
  const currency = useMemo(getIframeCurrency, []);

  return (
    <Media
      image={
        <AvatarIcon
          address={wallet.address}
          active={false}
          size={40}
          borderRadius={4}
        />
      }
      text={walletInfo?.name ?? getWalletDisplayName(wallet)}
      vGap={0}
      detailText={
        <UIText kind="headline/h3">
          {' '}
          {walletInfo?.portfolio != null ? (
            <NeutralDecimals
              parts={formatCurrencyToParts(
                walletInfo?.portfolio ?? 0,
                'en',
                currency
              )}
            />
          ) : (
            NBSP
          )}
        </UIText>
      }
    />
  );
}

function WalletMediaData({
  wallet,
  handleRequest,
}: {
  wallet: ExternallyOwnedAccount;
  handleRequest: (request: ControllerRequest) => Promise<unknown>;
}) {
  const { data } = useQuery({
    suspense: false,
    queryKey: ['iframe/wallet-info', wallet.address],
    queryFn: () =>
      handleRequest({
        method: 'wallet-info',
        params: { address: wallet.address },
      }),
    staleTime: Infinity,
  });
  return (
    <WalletMediaPresentation
      wallet={wallet}
      walletInfo={data as WalletInfo | undefined}
    />
  );
}

function AddressSelectList({
  ledger,
  pathType,
  onImport,
  existingAddressesSet,
  handleRequest,
}: {
  pathType: DerivationPathType;
  ledger: DeviceConnection;
  existingAddressesSet: Set<string>;
  onImport: (values: DeviceAccount[]) => void;
  handleRequest: (request: ControllerRequest) => Promise<unknown>;
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
  const wallets = data.pages.flatMap((items) =>
    items.map((item) => ({
      address: item.account.address,
      name: null,
      privateKey: '<ledger-private-key>',
      mnemonic: {
        path: item.derivationPath,
        phrase: '<ledger-mnemonic>',
      },
    }))
  );

  return (
    <>
      <PageFullBleedColumn
        paddingInline={false}
        style={{
          flexGrow: 1,
          overflow: 'auto',
          height: 0, // flexbox fix
          ['--surface-background-color' as string]: 'var(--background)',
        }}
      >
        <WalletListPresentation
          values={values}
          derivationPathType={pathType}
          wallets={wallets}
          renderMedia={(index) => (
            <WalletMediaData
              wallet={wallets[index]}
              handleRequest={handleRequest}
            />
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

export function ImportLedgerAddresses({
  ledger,
  existingAddressesSet,
  onImport,
  handleRequest,
}: {
  ledger: DeviceConnection;
  existingAddressesSet: Set<string>;
  onImport: (values: DeviceAccount[]) => void;
  handleRequest: (request: ControllerRequest) => Promise<unknown>;
}) {
  const [pathType, setPathType] = useState<DerivationPathType>('ledgerLive');
  return (
    <PageColumn
      style={{ height: '100%', position: 'relative' }}
      paddingInline={24}
    >
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
      <SegmentedControlGroup style={{ paddingTop: 4 }}>
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
        <SegmentedControlRadio
          name="pathType"
          value="bip44"
          checked={pathType === 'bip44'}
          onChange={(event) =>
            setPathType(event.currentTarget.value as DerivationPathType)
          }
        >
          BIP44
        </SegmentedControlRadio>
        <SegmentedControlRadio
          name="pathType"
          value="ledger"
          checked={pathType === 'ledger'}
          onChange={(event) =>
            setPathType(event.currentTarget.value as DerivationPathType)
          }
        >
          Legacy
        </SegmentedControlRadio>
      </SegmentedControlGroup>
      <Spacer height={24} />
      <AddressSelectList
        key={pathType}
        ledger={ledger}
        pathType={pathType}
        onImport={onImport}
        handleRequest={handleRequest}
        existingAddressesSet={existingAddressesSet}
      />
    </PageColumn>
  );
}
