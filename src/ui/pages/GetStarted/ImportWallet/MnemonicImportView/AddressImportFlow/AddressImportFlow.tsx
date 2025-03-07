import groupBy from 'lodash/groupBy';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import EcosystemEthereumIcon from 'jsx:src/ui/assets/ecosystem-ethereum.svg';
import EcosystemSolanaIcon from 'jsx:src/ui/assets/ecosystem-solana.svg';
import { useCurrency } from 'src/modules/currency/useCurrency';
import { isSolanaAddress } from 'src/modules/solana/shared';
import { isEthereumAddress } from 'src/shared/isEthereumAddress';
import { normalizeAddress } from 'src/shared/normalizeAddress';
import type { MaskedBareWallet } from 'src/shared/types/BareWallet';
import { formatCurrencyToParts } from 'src/shared/units/formatCurrencyValue';
import { PageBottom } from 'src/ui/components/PageBottom';
import { PageColumn } from 'src/ui/components/PageColumn';
import { PagePaddingInline } from 'src/ui/components/PageColumn/PageColumn';
import { PageFullBleedColumn } from 'src/ui/components/PageFullBleedColumn';
import { PageStickyFooter } from 'src/ui/components/PageStickyFooter';
import { PageTop } from 'src/ui/components/PageTop';
import { PortfolioValue } from 'src/ui/shared/requests/PortfolioValue';
import { useAllExistingMnemonicAddresses } from 'src/ui/shared/requests/useAllExistingAddresses';
import { NBSP } from 'src/ui/shared/typography';
import { Button } from 'src/ui/ui-kit/Button';
import { HStack } from 'src/ui/ui-kit/HStack';
import { BottomSheetDialog } from 'src/ui/ui-kit/ModalDialogs/BottomSheetDialog';
import { DialogTitle } from 'src/ui/ui-kit/ModalDialogs/DialogTitle';
import type { HTMLDialogElementInterface } from 'src/ui/ui-kit/ModalDialogs/HTMLDialogElementInterface';
import { NeutralDecimals } from 'src/ui/ui-kit/NeutralDecimals';
import { Spacer } from 'src/ui/ui-kit/Spacer';
import { UIText } from 'src/ui/ui-kit/UIText';
import { VStack } from 'src/ui/ui-kit/VStack';
import type { DerivationPathType } from 'src/shared/wallet/derivation-paths';
import { AddressImportMessages } from './AddressImportMessages';
import { WalletList, WalletListPresentation } from './WalletList';

export type DerivedWallets = Array<{
  curve: 'ecdsa' | 'ed25519';
  pathType: DerivationPathType;
  wallets: MaskedBareWallet[];
}>;

export function PortfolioValueDetail({ address }: { address: string }) {
  const { currency } = useCurrency();

  return (
    <UIText kind="headline/h2">
      <PortfolioValue
        address={address}
        render={({ data }) => {
          if (data) {
            const value = data.data?.totalValue ?? 0;
            return (
              <NeutralDecimals
                parts={formatCurrencyToParts(value, 'en', currency)}
              />
            );
          } else {
            return <span>{NBSP}</span>;
          }
        }}
      />
    </UIText>
  );
}

function useToggledValues<T>(initialValues: Set<T> | (() => Set<T>)) {
  const [values, setValues] = useState<Set<T>>(initialValues);
  const toggleValue = useCallback((value: T) => {
    setValues((set) => {
      const newSet = new Set(set);
      if (newSet.has(value)) {
        newSet.delete(value);
        return newSet;
      } else {
        return newSet.add(value);
      }
    });
  }, []);
  return [values, toggleValue] as const;
}

function SelectMoreWalletsDialog({
  dialogRef,
  wallets,
  existingAddressesSet,
  activeWallets,
  initialValues,
  onSubmit,
}: {
  initialValues: Set<string>;
  wallets: DerivedWallets | null;
  existingAddressesSet: Set<string>;
  activeWallets: Record<string, { active: boolean }>;
  dialogRef: React.RefObject<HTMLDialogElementInterface>;
  onSubmit: (values: Set<string>) => void;
}) {
  const groupedByEcosystem = useMemo(() => {
    const toActiveStatus = ({ address }: { address: string }) =>
      activeWallets[normalizeAddress(address)]?.active ? 'active' : 'rest';

    type Grouped = Record<'active' | 'rest', MaskedBareWallet[] | undefined>;
    return wallets?.reduce((acc, config) => {
      const key = `${config.curve}:${config.pathType}`;
      acc[key] = groupBy(config.wallets, toActiveStatus) as Grouped;
      return acc;
    }, {} as { [key: string]: Grouped });
  }, [activeWallets, wallets]);

  const [curve, setCurve] = useState<'ecdsa' | 'ed25519'>('ecdsa');
  const ethPathType = 'bip44';
  type SolanaPathType =
    | 'solanaBip44Change'
    | 'solanaBip44'
    | 'solanaDeprecated';
  const [solPathType, setSolPathType] =
    useState<SolanaPathType>('solanaBip44Change');

  const [values, toggleValue] = useToggledValues(initialValues);

  if (!groupedByEcosystem) {
    return null;
  }

  const filter =
    curve === 'ecdsa' ? `${curve}:${ethPathType}` : `${curve}:${solPathType}`;
  const { active, rest } = groupedByEcosystem[filter];
  return (
    <BottomSheetDialog
      ref={dialogRef}
      height="90vh"
      containerStyle={{ padding: 0 }}
      renderWhenOpen={() => (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            minHeight: '100%',
          }}
        >
          <div
            style={{
              padding: 20,
              position: 'sticky',
              top: 0,
              backgroundColor: 'var(--z-index-0)',
              zIndex: 1,
            }}
          >
            <DialogTitle
              title={<UIText kind="headline/h3">Select Another Wallet</UIText>}
            />
          </div>
          <Spacer height={8} />
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 3fr 1fr',
              paddingInline: 20,
            }}
          >
            <div
              style={{
                placeSelf: 'center',
                gridColumnStart: 2,
                display: 'flex',
                gap: 12,
              }}
            >
              <label>
                <input
                  type="radio"
                  name="curve"
                  value="ecdsa"
                  checked={curve === 'ecdsa'}
                  onChange={() => setCurve('ecdsa')}
                />{' '}
                EVM
              </label>
              <label>
                <input
                  type="radio"
                  name="curve"
                  value="ed25519"
                  checked={curve === 'ed25519'}
                  onChange={() => setCurve('ed25519')}
                />{' '}
                Solana
              </label>
            </div>
            {curve === 'ed25519' ? (
              <select
                style={{ justifySelf: 'end' }}
                name="solPathType"
                value={solPathType}
                onChange={(event) =>
                  setSolPathType(event.currentTarget.value as SolanaPathType)
                }
              >
                <option value="solanaBip44Change">Bip44Change</option>
                <option value="solanaBip44">Bip44</option>
                <option value="solanaDeprecated">Deprecated</option>
              </select>
            ) : null}
          </div>
          <Spacer height={24} />

          {active?.length ? (
            <WalletList
              listTitle={
                <div style={{ paddingInline: 20 }}>Active wallets</div>
              }
              wallets={active}
              renderDetail={(index) => (
                <PortfolioValueDetail address={active[index].address} />
              )}
              existingAddressesSet={existingAddressesSet}
              values={values}
              onSelect={toggleValue}
            />
          ) : null}
          {rest ? (
            <WalletList
              listTitle={
                <div style={{ paddingInline: 20 }}>Inactive wallets</div>
              }
              initialCount={5}
              wallets={rest}
              renderDetail={null}
              existingAddressesSet={existingAddressesSet}
              values={values}
              onSelect={toggleValue}
            />
          ) : null}

          <div
            style={{
              position: 'sticky',
              bottom: 0,
              padding: 20,
              backgroundColor: 'var(--z-index-0)',
            }}
          >
            <Button
              disabled={values.size === 0}
              onClick={() => onSubmit(values)}
              style={{ width: '100%' }}
            >
              Continue{values.size ? ` (${values.size})` : null}
            </Button>
          </div>
        </div>
      )}
    />
  );
}

function EcosystemTitleHelper({ kind }: { kind: 'solana' | 'ethereum' }) {
  const config = {
    solana: { icon: <EcosystemSolanaIcon />, title: 'Solana wallets' },
    ethereum: {
      icon: <EcosystemEthereumIcon />,
      title: 'EVM wallets',
    },
  };

  return (
    <HStack gap={8}>
      {config[kind].icon}
      {config[kind].title}
    </HStack>
  );
}

function suggestInitialWallets({
  wallets,
  activeWallets,
  existingAddressesSet,
}: {
  wallets: DerivedWallets;
  activeWallets: Record<string, { active: boolean }>;
  existingAddressesSet: Set<string>;
}): {
  activeCount: number;
  groups: { ecosystem: 'solana' | 'ethereum'; wallets: MaskedBareWallet[] }[];
} {
  const allWallets = wallets.flatMap((config) => config.wallets);
  const newOnes = allWallets.filter(
    (w) => !existingAddressesSet.has(normalizeAddress(w.address))
  );
  const grouped = groupBy(newOnes, ({ address }) =>
    activeWallets[normalizeAddress(address)]?.active ? 'active' : 'rest'
  );
  const { active, rest } = grouped as Record<
    'active' | 'rest',
    MaskedBareWallet[] | undefined
  >;
  if (active?.length) {
    // display all found active addresses
    const ethWallets = active.filter((w) => isEthereumAddress(w.address));
    const solWallets = active.filter((w) => isSolanaAddress(w.address));
    return {
      activeCount: active.length,
      groups: [
        { ecosystem: 'ethereum', wallets: ethWallets },
        { ecosystem: 'solana', wallets: solWallets },
      ],
    };
  } else {
    // display only one eth and one solana address
    const ethWallet = rest?.find((w) => isEthereumAddress(w.address));
    const solanaWallet = rest?.find((w) => isSolanaAddress(w.address));
    return {
      activeCount: 0,
      groups: [
        { ecosystem: 'ethereum', wallets: ethWallet ? [ethWallet] : [] },
        { ecosystem: 'solana', wallets: solanaWallet ? [solanaWallet] : [] },
      ],
    };
  }
}

function AddressImportList({
  wallets,
  activeWallets,
  onSubmit,
}: {
  wallets: DerivedWallets;
  activeWallets: Record<string, { active: boolean }>;
  onSubmit: (values: MaskedBareWallet[]) => void;
}) {
  const existingAddresses = useAllExistingMnemonicAddresses();
  const existingAddressesSet = useMemo(
    () => new Set(existingAddresses),
    [existingAddresses]
  );
  const suggestedWallets = useMemo(
    () =>
      suggestInitialWallets({ wallets, activeWallets, existingAddressesSet }),
    [activeWallets, existingAddressesSet, wallets]
  );
  const [values, toggleAddress] = useToggledValues<string>(() => {
    return new Set(
      suggestedWallets.groups.flatMap((group) =>
        group.wallets.map((w) => w.address)
      )
    );
  });
  const moreWalletsDialogRef = useRef<HTMLDialogElementInterface>(null);
  return (
    <>
      <PageColumn>
        <PageTop />
        <VStack gap={24}>
          {suggestedWallets.activeCount ? (
            <UIText kind="headline/h3" style={{ textAlign: 'center' }}>
              We found{' '}
              {suggestedWallets.activeCount === 1
                ? '1 active wallet'
                : `${suggestedWallets.activeCount} active wallets`}
            </UIText>
          ) : (
            <VStack gap={0} style={{ textAlign: 'center' }}>
              <UIText kind="headline/h3">
                We didn’t find any active wallets
              </UIText>
              <UIText kind="small/accent" color="var(--neutral-600)">
                Start with these wallets associated <br /> with your recovery
                phrase
              </UIText>
            </VStack>
          )}
          <PageFullBleedColumn paddingInline={false}>
            <VStack gap={20}>
              {suggestedWallets.groups
                .filter((group) => group.wallets.length)
                .map((group) => (
                  <WalletListPresentation
                    displayPathIndex={false}
                    listTitle={
                      <PagePaddingInline>
                        <EcosystemTitleHelper kind={group.ecosystem} />
                      </PagePaddingInline>
                    }
                    wallets={group.wallets}
                    hasMore={false}
                    onLoadMore={null}
                    renderDetail={
                      suggestedWallets.activeCount
                        ? (index) => (
                            <PortfolioValueDetail
                              address={group.wallets[index].address}
                            />
                          )
                        : null
                    }
                    existingAddressesSet={existingAddressesSet}
                    values={values}
                    onSelect={toggleAddress}
                  />
                ))}
            </VStack>
          </PageFullBleedColumn>
        </VStack>
        <PageBottom />
      </PageColumn>

      <PageStickyFooter lineColor="var(--neutral-300)">
        <Spacer height={8} />
        <VStack style={{ textAlign: 'center' }} gap={8}>
          <Button
            kind="ghost"
            onClick={() => {
              moreWalletsDialogRef.current?.showModal();
            }}
          >
            <UIText kind="body/accent">Select Another Wallet</UIText>
          </Button>

          <Button
            disabled={values.size === 0}
            onClick={() => {
              const selectedWallets = wallets
                .flatMap((c) => c.wallets)
                .filter((wallet) => values.has(wallet.address));
              onSubmit(selectedWallets);
            }}
          >
            Continue{values.size ? ` (${values.size})` : null}
          </Button>
        </VStack>
        <PageBottom />
      </PageStickyFooter>
      <SelectMoreWalletsDialog
        initialValues={values}
        wallets={wallets}
        activeWallets={activeWallets}
        existingAddressesSet={existingAddressesSet}
        dialogRef={moreWalletsDialogRef}
        onSubmit={(values) => {
          const selectedWallets = wallets
            .flatMap((c) => c.wallets)
            .filter((wallet) => values.has(wallet.address));
          onSubmit(selectedWallets);
        }}
      />
    </>
  );
}

export function AddressImportFlow({
  wallets,
  activeWallets,
}: {
  wallets: DerivedWallets;
  activeWallets: Record<string, { active: boolean }>;
}) {
  const [valuesToImport, setValuesToImport] = useState<MaskedBareWallet[]>();
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
