import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import type { UserInteractionRequested } from '@zeriontech/hardware-wallet-connection';
import {
  deniedByUser,
  getAddressesEth,
  getAddressesSolana,
  parseLedgerError,
} from '@zeriontech/hardware-wallet-connection';
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
import { opaqueType } from 'src/shared/type-utils/Opaque';
import type { LocallyEncoded } from 'src/shared/wallet/encode-locally';
import { HStack } from 'src/ui/ui-kit/HStack';
import EcosystemEthereumIcon from 'jsx:src/ui/assets/ecosystem-ethereum.svg';
import EcosystemSolanaIcon from 'jsx:src/ui/assets/ecosystem-solana.svg';
import type { MaskedBareWallet } from 'src/shared/types/BareWallet';
import { CircleSpinner } from 'src/ui/ui-kit/CircleSpinner';
import { VStack } from 'src/ui/ui-kit/VStack';
import { DelayedRender } from 'src/ui/components/DelayedRender';
import type { DeviceConnection } from '../types';
import { InteractionRequested } from '../InterationRequested/InteractionRequested';
import { TroubleshootingDialog } from '../TroubleshootingDialog';

type ControllerRequest = Omit<RpcRequest, 'id'>;
type CurveValue = 'ecdsa' | 'ed25519';

// We don't have access to preference-store inside iframe and can't use useCurrency hook
function getIframeCurrency() {
  const pageUrl = new URL(window.location.href);
  const currencyStateParam = pageUrl.searchParams.get('currency');
  invariant(currencyStateParam, 'currency param is required');
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
          borderRadius={12}
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

const COUNT = 5;

function AddressSelectList({
  existingAddressesSet,
  onImport,
  handleRequest,
  isFetchingNextPage,
  onFetchNextPage,
  wallets,
  itemsByAddress,
}: {
  existingAddressesSet: Set<string>;
  onImport: (values: DeviceAccount[]) => void;
  handleRequest: (request: ControllerRequest) => Promise<unknown>;
  isFetchingNextPage: boolean;
  onFetchNextPage: () => void;
  wallets: MaskedBareWallet[];
  itemsByAddress: Map<string, { derivationPath: string }>;
}) {
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
          wallets={wallets}
          renderMedia={(index) => (
            <WalletMediaData
              wallet={wallets[index]}
              handleRequest={handleRequest}
            />
          )}
          renderDetail={null}
          listTitle={null}
          onSelect={toggleAddress}
          existingAddressesSet={existingAddressesSet}
          hasMore={true} // ledger can derive infinite amount of addresses
          isLoadingMore={isFetchingNextPage}
          onLoadMore={() => {
            onFetchNextPage();
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
  const [curve, setCurve] = useState<CurveValue | null>(null);
  const [pathType, setPathType] = useState<DerivationPathType | null>(null);
  const [interactionRequested, setInteractionRequested] =
    useState<UserInteractionRequested | null>(null);
  const [loadedWallets, setLoadedWallets] = useState(0);
  const { sessionId } = ledger;

  const {
    data,
    fetchNextPage,
    isFetchingNextPage,
    isFetching,
    isLoading,
    error: maybeError,
    refetch,
  } = useInfiniteQuery({
    queryKey: [
      'ledger/addresses',
      COUNT,
      pathType,
      sessionId,
      curve,
      setInteractionRequested,
      setLoadedWallets,
    ],
    queryFn: async ({ pageParam = 0 }) => {
      if (curve === null || pathType === null) {
        return [];
      }
      return curve === 'ecdsa'
        ? getAddressesEth(
            {
              type: pathType,
              from: pageParam,
              count: COUNT,
            },
            {
              sessionId,
              onInteractionRequested: setInteractionRequested,
              onProgress: (progress) =>
                pageParam === 0 ? setLoadedWallets(progress) : undefined,
            }
          )
        : getAddressesSolana(
            {
              type: pathType,
              from: pageParam,
              count: COUNT,
            },
            {
              sessionId,
              onInteractionRequested: setInteractionRequested,
              onProgress: (progress) =>
                pageParam === 0 ? setLoadedWallets(progress) : undefined,
            }
          );
    },
    getNextPageParam: (_lastPage, allPages) => {
      return allPages.reduce((sum, items) => sum + items.length, 0);
    },
    retry: 0,
    refetchOnWindowFocus: false,
    suspense: false,
    staleTime: Infinity, // addresses found on ledger will not change
    useErrorBoundary: false,
    enabled: curve !== null && pathType !== null,
  });

  const parsedError = maybeError ? parseLedgerError(maybeError) : null;
  const isUserRejectedError = parsedError ? deniedByUser(parsedError) : false;
  const isError = Boolean(parsedError) && !isUserRejectedError;

  useEffect(() => {
    if (!isFetching) {
      setInteractionRequested(null);
    }
  }, [isFetching]);

  const itemsByAddress = useMemo(
    () =>
      new Map(
        data?.pages.flatMap((items) =>
          items.map((item) => [item.account.address, item])
        )
      ),
    [data]
  );

  const wallets = useMemo(
    () =>
      data?.pages.flatMap((items) =>
        items.map((item) => ({
          address: item.account.address,
          name: null,
          // we're not gonna read this prop and only need to match type
          privateKey: opaqueType<LocallyEncoded>('<ledger-private-key>'),
          mnemonic: {
            path: item.derivationPath,
            // we're not gonna read this prop and only need to match type
            phrase: opaqueType<LocallyEncoded>('<ledger-mnemonic>'),
          },
        }))
      ),
    [data]
  );

  if (curve === null || pathType === null) {
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
            textAlign: 'center',
          }}
        >
          <UIText kind="headline/hero">Select Ecosystem</UIText>
          <Spacer height={24} />
        </PageFullBleedColumn>
        <VStack
          gap={12}
          style={{
            justifyItems: 'center',
            width: '100%',
            flexGrow: 1,
            paddingBottom: 80,
          }}
        >
          <Button
            style={{ width: 320, alignSelf: 'end' }}
            onClick={() => {
              setCurve('ecdsa');
              setPathType('ledgerLive');
            }}
          >
            <HStack gap={8} alignItems="center">
              <EcosystemEthereumIcon style={{ width: 24, height: 24 }} />
              <span>Connect Ethereum Address</span>
            </HStack>
          </Button>

          <Button
            style={{ width: 320 }}
            onClick={() => {
              setCurve('ed25519');
              setPathType('solanaBip44Change');
            }}
          >
            <HStack gap={8} alignItems="center">
              <EcosystemSolanaIcon style={{ width: 24, height: 24 }} />
              <span>Connect Solana Address</span>
            </HStack>
          </Button>
        </VStack>
      </PageColumn>
    );
  }

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
      <VStack gap={12} style={{ justifyItems: 'center', width: '100%' }}>
        <div
          style={{
            placeSelf: 'center',
            display: 'flex',
            gap: 12,
          }}
        >
          <SegmentedControlGroup kind="secondary">
            <SegmentedControlRadio
              name="curve"
              value="ecdsa"
              checked={curve === 'ecdsa'}
              onChange={(event) => {
                setCurve(event.currentTarget.value as CurveValue);
                setPathType('ledgerLive');
                setLoadedWallets(0);
              }}
              style={{ width: 120 }}
              disabled={isFetching}
            >
              <HStack gap={8} alignItems="center">
                <EcosystemEthereumIcon />
                <span>EVM</span>
              </HStack>
            </SegmentedControlRadio>
            <SegmentedControlRadio
              name="curve"
              value="ed25519"
              checked={curve === 'ed25519'}
              onChange={(event) => {
                setCurve(event.currentTarget.value as CurveValue);
                setPathType('solanaBip44Change');
                setLoadedWallets(0);
              }}
              style={{ width: 120 }}
              disabled={isFetching}
            >
              <HStack gap={8} alignItems="center">
                <EcosystemSolanaIcon />
                <span>Solana</span>
              </HStack>
            </SegmentedControlRadio>
          </SegmentedControlGroup>
        </div>
        <div style={{ width: '100%' }}>
          {curve === 'ecdsa' ? (
            <SegmentedControlGroup style={{ paddingTop: 4 }}>
              <SegmentedControlRadio
                name="pathType"
                value="ledgerLive"
                checked={pathType === 'ledgerLive'}
                onChange={(event) => {
                  setPathType(event.currentTarget.value as DerivationPathType);
                  setLoadedWallets(0);
                }}
                disabled={isFetching}
              >
                Ledger Live
              </SegmentedControlRadio>
              <SegmentedControlRadio
                name="pathType"
                value="bip44"
                checked={pathType === 'bip44'}
                onChange={(event) => {
                  setPathType(event.currentTarget.value as DerivationPathType);
                  setLoadedWallets(0);
                }}
                disabled={isFetching}
              >
                BIP44
              </SegmentedControlRadio>
              <SegmentedControlRadio
                name="pathType"
                value="ledger"
                checked={pathType === 'ledger'}
                onChange={(event) => {
                  setPathType(event.currentTarget.value as DerivationPathType);
                  setLoadedWallets(0);
                }}
                disabled={isFetching}
              >
                Legacy
              </SegmentedControlRadio>
            </SegmentedControlGroup>
          ) : (
            <SegmentedControlGroup style={{ paddingTop: 4 }}>
              <SegmentedControlRadio
                name="pathType"
                value="solanaBip44Change"
                checked={pathType === 'solanaBip44Change'}
                onChange={(event) => {
                  setPathType(event.currentTarget.value as DerivationPathType);
                  setLoadedWallets(0);
                }}
              >
                Bip44 Change
              </SegmentedControlRadio>
              <SegmentedControlRadio
                name="pathType"
                value="solanaBip44"
                checked={pathType === 'solanaBip44'}
                onChange={(event) => {
                  setPathType(event.currentTarget.value as DerivationPathType);
                  setLoadedWallets(0);
                }}
                disabled={isFetching}
              >
                BIP44
              </SegmentedControlRadio>
              <SegmentedControlRadio
                name="pathType"
                value="solanaDeprecated"
                checked={pathType === 'solanaDeprecated'}
                onChange={(event) => {
                  setPathType(event.currentTarget.value as DerivationPathType);
                  setLoadedWallets(0);
                }}
                disabled={isFetching}
              >
                Legacy
              </SegmentedControlRadio>
            </SegmentedControlGroup>
          )}
        </div>
      </VStack>
      <Spacer height={24} />
      {isLoading ? (
        <div
          style={{
            flexGrow: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            paddingBottom: 40,
          }}
        >
          {interactionRequested && interactionRequested !== 'none' ? (
            <InteractionRequested
              kind={interactionRequested}
              ecosystem={curve === 'ecdsa' ? 'evm' : 'solana'}
            />
          ) : (
            <DelayedRender delay={1000}>
              <HStack alignItems="center" gap={24}>
                <CircleSpinner color="var(--primary)" size="24px" />
                <UIText kind="headline/h3">
                  Fetching addresses ({loadedWallets} / {COUNT})
                </UIText>
              </HStack>
            </DelayedRender>
          )}
        </div>
      ) : isError ? (
        <div
          style={{
            flexGrow: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            paddingBottom: 40,
            flexDirection: 'column',
            gap: 16,
          }}
        >
          <UIText kind="small/regular" color="var(--negative-500)">
            {parsedError ? parsedError.message : 'An unknown error occurred'}
          </UIText>
          <TroubleshootingDialog error={parsedError} />
          <Button onClick={() => refetch()} kind="primary">
            Try Again
          </Button>
        </div>
      ) : (
        <AddressSelectList
          key={pathType}
          isFetchingNextPage={isFetchingNextPage}
          onFetchNextPage={() => {
            fetchNextPage();
          }}
          wallets={wallets ?? []}
          itemsByAddress={itemsByAddress}
          onImport={onImport}
          handleRequest={handleRequest}
          existingAddressesSet={existingAddressesSet}
        />
      )}
    </PageColumn>
  );
}
