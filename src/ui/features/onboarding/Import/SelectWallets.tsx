import { useQuery } from '@tanstack/react-query';
import React, { useMemo, useRef } from 'react';
import { Content } from 'react-area';
import { invariant } from 'src/shared/invariant';
import type { MaskedBareWallet } from 'src/shared/types/BareWallet';
import { wait } from 'src/shared/wait';
import { encodeForMasking } from 'src/shared/wallet/encode-locally';
import { BlockchainTitleHelper } from 'src/ui/components/BlockchainTitleHelper';
import { useToggledValues } from 'src/ui/components/useToggledValues';
import {
  prepareWalletsToImport,
  suggestInitialWallets,
  type DerivedWallets,
} from 'src/ui/pages/GetStarted/ImportWallet/MnemonicImportView/helpers';
import {
  PortfolioValueDetail,
  SelectMoreWalletsDialog,
} from 'src/ui/pages/GetStarted/ImportWallet/MnemonicImportView/AddressImportFlow/AddressImportFlow';
import { WalletListPresentation } from 'src/ui/pages/GetStarted/ImportWallet/MnemonicImportView/AddressImportFlow/WalletList';
import { useAddressActivity } from 'src/ui/shared/requests/useAddressActivity';
import { useAllExistingMnemonicAddresses } from 'src/ui/shared/requests/useAllExistingAddresses';
import { useStaleTime } from 'src/ui/shared/useStaleTime';
import { Button } from 'src/ui/ui-kit/Button';
import { UIText } from 'src/ui/ui-kit/UIText';
import { VStack } from 'src/ui/ui-kit/VStack';
import type { HTMLDialogElementInterface } from 'src/ui/ui-kit/ModalDialogs/HTMLDialogElementInterface';
import { SelectWalletsFAQ } from '../FAQ';
import * as helperStyles from '../shared/helperStyles.module.css';

function ChooseWalletsToImport({
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
      <VStack gap={32}>
        <VStack gap={8}>
          {suggestedWallets.activeCount ? (
            <UIText kind="headline/h2">
              We found{' '}
              {suggestedWallets.activeCount === 1
                ? '1 active wallet'
                : `${suggestedWallets.activeCount} active wallets`}
            </UIText>
          ) : (
            <VStack gap={8}>
              <UIText kind="headline/h2">
                We didn’t find any active wallets
              </UIText>
              <UIText kind="body/regular">
                Start with these wallets associated <br /> with your recovery
                phrase
              </UIText>
            </VStack>
          )}
        </VStack>
        <VStack
          gap={20}
          style={{
            marginInline: -16,
            ['--surface-background-color' as string]: 'transparent',
          }}
        >
          {suggestedWallets.groups
            .filter((group) => group.wallets.length)
            .map((group) => (
              <WalletListPresentation
                key={group.ecosystem}
                displayPathIndex={false}
                listTitle={
                  <div style={{ paddingInline: 16 }}>
                    <BlockchainTitleHelper kind={group.ecosystem} />
                  </div>
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
        <VStack gap={8}>
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
      </VStack>
      <Content name="onboarding-faq">
        <SelectWalletsFAQ />
      </Content>
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

export function SelectWallets({
  mnemonic,
  onSelect,
}: {
  mnemonic: string | null;
  onSelect(wallets: MaskedBareWallet[]): void;
}) {
  invariant(mnemonic, 'Seed phrase is empty');

  const { data, isLoading } = useQuery({
    queryKey: ['prepareWalletsToImport', mnemonic],
    queryFn: async () => {
      await wait(1000);
      const phrase = encodeForMasking(mnemonic);
      return prepareWalletsToImport(phrase);
    },
    useErrorBoundary: true,
    suspense: false,
  });

  const { value: activeWallets, isLoading: activeWalletsAreLoading } =
    useAddressActivity(
      { addresses: data?.addressesToCheck || [] },
      { enabled: Boolean(data?.addressesToCheck), keepStaleData: true }
    );

  const { isStale: isStaleValue } = useStaleTime(activeWallets, 5000);
  const shouldWaitForValue = activeWallets == null && !isStaleValue;

  return data == null ||
    (shouldWaitForValue && (isLoading || activeWalletsAreLoading)) ? (
    <div className={helperStyles.loadingOverlay}>
      <UIText kind="headline/hero" className={helperStyles.loadingTitle}>
        Looking for Wallets
      </UIText>
    </div>
  ) : (
    <ChooseWalletsToImport
      wallets={data.derivedWallets}
      activeWallets={activeWallets ?? {}}
      onSubmit={(values) => onSelect(values)}
    />
  );
}
