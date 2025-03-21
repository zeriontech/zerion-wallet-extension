import groupBy from 'lodash/groupBy';
import React, { useMemo, useRef, useState } from 'react';
import EcosystemEthereumIcon from 'jsx:src/ui/assets/ecosystem-ethereum.svg';
import EcosystemSolanaIcon from 'jsx:src/ui/assets/ecosystem-solana.svg';
import SettingsSlidersIcon from 'jsx:src/ui/assets/settings-sliders.svg';
import QuestionHintIcon from 'jsx:src/ui/assets/question-hint.svg';
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
import {
  SegmentedControlGroup,
  SegmentedControlRadio,
} from 'src/ui/ui-kit/SegmentedControl';
import { useToggledValues } from 'src/ui/components/useToggledValues';
import { UnstyledButton } from 'src/ui/ui-kit/UnstyledButton';
import type { BlockchainType } from 'src/shared/wallet/classifiers';
import { BlockchainTitleHelper } from 'src/ui/components/BlockchainTitleHelper';
import { AddressImportMessages } from './AddressImportMessages';
import { WalletList, WalletListPresentation } from './WalletList';

export type DerivedWallets = Array<{
  curve: 'ecdsa' | 'ed25519';
  pathType: DerivationPathType;
  wallets: MaskedBareWallet[];
}>;

function DecoratedSettingsSelect({
  select,
}: {
  select: (style: React.CSSProperties) => React.ReactNode;
}) {
  return (
    <div style={{ position: 'relative', justifySelf: 'end', padding: 1 }}>
      {select({
        position: 'absolute',
        inset: 0,
        borderRadius: 999,
        border: 'none',
      })}
      <div
        style={{
          pointerEvents: 'none',
          position: 'relative',
          backgroundColor: 'var(--neutral-300)',
          borderRadius: 999,
          paddingBlock: 6,
          paddingInline: 12,
        }}
      >
        <SettingsSlidersIcon
          style={{ display: 'block', width: 20, height: 20 }}
        />
      </div>
    </div>
  );
}

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

function InactiveWalletsHint() {
  const dialogRef = useRef<HTMLDialogElementInterface>(null);
  return (
    <>
      <UnstyledButton
        onClick={() => dialogRef.current?.showModal()}
        style={{ verticalAlign: 'middle' }}
      >
        <QuestionHintIcon style={{ color: 'var(--neutral-500)' }} />
        <BottomSheetDialog ref={dialogRef} height="min-content">
          <DialogTitle
            alignTitle="start"
            title={<UIText kind="headline/h3">Inactive Wallets</UIText>}
          />
          <Spacer height={8} />
          <UIText kind="small/regular" style={{ textAlign: 'start' }}>
            The wallets that have zero balance or no transactions on the
            supported chains.
          </UIText>
          <Spacer height={24} />
          <form method="dialog">
            <Button>Close</Button>
          </form>
        </BottomSheetDialog>
      </UnstyledButton>
    </>
  );
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

  type CurveValue = 'ecdsa' | 'ed25519';
  const [curve, setCurve] = useState<CurveValue>('ecdsa');
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
              position: 'sticky',
              top: 0,
              zIndex: 1,
              backgroundColor: 'var(--z-index-0)',
              paddingBottom: 12,
              borderBottom: '1px solid var(--neutral-200)',
            }}
          >
            <div style={{ padding: 20 }}>
              <DialogTitle
                title={
                  <UIText kind="headline/h3">Select Another Wallet</UIText>
                }
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
                <SegmentedControlGroup kind="secondary">
                  <SegmentedControlRadio
                    name="curve"
                    value="ecdsa"
                    checked={curve === 'ecdsa'}
                    onChange={(event) =>
                      setCurve(event.currentTarget.value as CurveValue)
                    }
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
                    onChange={(event) =>
                      setCurve(event.currentTarget.value as CurveValue)
                    }
                  >
                    <HStack gap={8} alignItems="center">
                      <EcosystemSolanaIcon />
                      <span>Solana</span>
                    </HStack>
                  </SegmentedControlRadio>
                </SegmentedControlGroup>
              </div>
              {curve === 'ed25519' ? (
                <DecoratedSettingsSelect
                  select={(style) => (
                    <select
                      style={style}
                      name="solPathType"
                      value={solPathType}
                      onChange={(event) =>
                        setSolPathType(
                          event.currentTarget.value as SolanaPathType
                        )
                      }
                    >
                      <option value="solanaBip44Change">Bip44Change</option>
                      <option value="solanaBip44">Bip44</option>
                      <option value="solanaDeprecated">Deprecated</option>
                    </select>
                  )}
                />
              ) : null}
            </div>
          </div>
          <Spacer height={24} />

          <div style={{ paddingInline: 4 }}>
            {active?.length ? (
              <WalletList
                listTitle={
                  <div style={{ paddingInline: 16 }}>Active wallets</div>
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
                  <div style={{ paddingInline: 16 }}>
                    Inactive wallets <InactiveWalletsHint />
                  </div>
                }
                initialCount={15}
                wallets={rest}
                renderDetail={null}
                existingAddressesSet={existingAddressesSet}
                values={values}
                onSelect={toggleValue}
              />
            ) : null}
          </div>

          <div
            style={{
              position: 'sticky',
              bottom: 0,
              padding: 20,
              backgroundColor: 'var(--z-index-0)',
              borderTop: '1px solid var(--neutral-200)',
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
  groups: { ecosystem: BlockchainType; wallets: MaskedBareWallet[] }[];
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
        { ecosystem: 'evm', wallets: ethWallets },
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
        { ecosystem: 'evm', wallets: ethWallet ? [ethWallet] : [] },
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
                    key={group.ecosystem}
                    displayPathIndex={false}
                    listTitle={
                      <PagePaddingInline>
                        <BlockchainTitleHelper kind={group.ecosystem} />
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
