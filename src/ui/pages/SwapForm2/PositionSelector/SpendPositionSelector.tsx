import React, {
  startTransition,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  ComboboxProvider,
  Combobox,
  ComboboxList,
  TabProvider,
} from '@ariakit/react';
import { normalizedContains } from 'normalized-contains';
import type { Networks } from 'src/modules/networks/Networks';
import type { FungiblePosition } from 'src/modules/zerion-api/requests/wallet-get-simple-positions';
import { UIText } from 'src/ui/ui-kit/UIText';
import { useCurrency } from 'src/modules/currency/useCurrency';
import { Dialog2 } from 'src/ui/ui-kit/ModalDialogs/Dialog2';
import { SearchInput } from 'src/ui/ui-kit/Input/SearchInput';
import { useDialog2 } from 'src/ui/ui-kit/ModalDialogs/Dialog2';
import { NetworkChips, TabPanelWrapper } from './NetworkChips';
import { TokenRow } from './TokenRow';
import { useTopNetworks } from './useTopNetworks';
import { NetworkSelectorDialog } from './NetworkSelectorDialog';
import * as styles from './styles.module.css';

export function SpendPositionSelector({
  positions,
  networks,
  currentChain,
  onSelect,
  open,
  onClose,
}: {
  positions: FungiblePosition[];
  networks: Networks;
  currentChain: string;
  onSelect: (position: FungiblePosition) => void;
  open: boolean;
  onClose: () => void;
}) {
  const { currency } = useCurrency();
  const [searchValue, setSearchValue] = useState('');
  const [selectedNetwork, setSelectedNetwork] = useState<string | null>(
    currentChain
  );
  const networkSelector = useDialog2();
  const comboboxRef = useRef<HTMLInputElement>(null);

  // Reset to current chain each time the dialog opens
  useEffect(() => {
    if (open) {
      setSelectedNetwork(currentChain);
      setSearchValue('');
    }
  }, [open, currentChain]);

  const topNetworks = useTopNetworks(positions, selectedNetwork);

  const filteredPositions = useMemo(() => {
    let result = positions;
    const networkFilter = selectedNetwork || null;
    if (networkFilter) {
      result = result.filter((p) => p.chain.id === networkFilter);
    }
    if (searchValue) {
      const query = searchValue.toLowerCase();
      result = result.filter(
        (p) =>
          normalizedContains(p.fungible.name.toLowerCase(), query) ||
          normalizedContains(p.fungible.symbol.toLowerCase(), query)
      );
    }
    return result.sort((a, b) => (b.amount.value || 0) - (a.amount.value || 0));
  }, [positions, selectedNetwork, searchValue]);

  return (
    <Dialog2 open={open} onClose={onClose} title="Pay with">
      <div style={{ height: 2 }} />
      <ComboboxProvider
        resetValueOnHide
        setValue={(value) => {
          startTransition(() => setSearchValue(value));
        }}
      >
        <TabProvider
          selectedId={selectedNetwork}
          setSelectedId={(id) => {
            startTransition(() => {
              setSelectedNetwork(
                id === selectedNetwork ? null : (id as string | null)
              );
            });
          }}
        >
          <div className={styles.searchWrapper}>
            <Combobox
              ref={comboboxRef}
              render={<SearchInput placeholder="Search tokens" />}
            />
          </div>
          <NetworkChips
            networks={topNetworks}
            onOpenNetworkSelector={networkSelector.openDialog}
          />
          <TabPanelWrapper>
            <ComboboxList alwaysVisible className={styles.tokenList}>
              {filteredPositions.length === 0 ? (
                <div className={styles.emptyState}>
                  <UIText kind="body/regular" color="var(--neutral-500)">
                    No tokens found
                  </UIText>
                </div>
              ) : (
                filteredPositions.map((position) => (
                  <TokenRow
                    key={`${position.chain.id}-${position.fungible.id}`}
                    fungible={position.fungible}
                    chainIconUrl={position.chain.iconUrl}
                    chainName={position.chain.name}
                    fiatValue={position.amount.value}
                    tokenQuantity={position.amount.quantity}
                    currency={currency}
                    onSelect={() => {
                      onSelect(position);
                      onClose();
                    }}
                  />
                ))
              )}
            </ComboboxList>
          </TabPanelWrapper>
        </TabProvider>
      </ComboboxProvider>
      <NetworkSelectorDialog
        open={networkSelector.open}
        onClose={networkSelector.closeDialog}
        networks={networks}
        positions={positions}
        mode="spend"
        onSelect={(chainId) => {
          setSelectedNetwork(chainId);
          networkSelector.closeDialog();
          requestAnimationFrame(() => comboboxRef.current?.focus());
        }}
      />
    </Dialog2>
  );
}
