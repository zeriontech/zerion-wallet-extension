import React, { startTransition, useEffect, useRef, useState } from 'react';
import {
  ComboboxProvider,
  Combobox,
  ComboboxList,
  TabProvider,
} from '@ariakit/react';
import type { Networks } from 'src/modules/networks/Networks';
import type { FungiblePosition } from 'src/modules/zerion-api/requests/wallet-get-simple-positions';
import type { Fungible } from 'src/modules/zerion-api/types/Fungible';
import { UIText } from 'src/ui/ui-kit/UIText';
import { useCurrency } from 'src/modules/currency/useCurrency';
import { useReceiveFungibles } from 'src/modules/zerion-api/hooks/useReceiveFungibles';
import { useSearchQueryFungibles } from 'src/modules/zerion-api/hooks/useSearchQueryFungibles';
import { Dialog2 } from 'src/ui/ui-kit/ModalDialogs/Dialog2';
import { SearchInput } from 'src/ui/ui-kit/Input/SearchInput';
import { useDebouncedCallback } from 'src/ui/shared/useDebouncedCallback';
import { useDialog2 } from 'src/ui/ui-kit/ModalDialogs/Dialog2';
import { NetworkChips, TabPanelWrapper } from './NetworkChips';
import { TokenRow } from './TokenRow';
import { useTopNetworks } from './useTopNetworks';
import { NetworkSelectorDialog } from './NetworkSelectorDialog';
import * as styles from './styles.module.css';

function ReceiveFungiblesList({
  chain,
  currency,
  onSelect,
}: {
  chain: string | null;
  currency: string;
  onSelect: (fungible: Fungible, chainId: string) => void;
}) {
  const { data } = useReceiveFungibles({
    chain: chain || undefined,
    currency,
  });

  if (!data) {
    return (
      <div className={styles.emptyState}>
        <UIText kind="body/regular" color="var(--neutral-500)">
          Loading...
        </UIText>
      </div>
    );
  }

  const { popular, others } = data.data;
  const hasResults = popular.length > 0 || others.length > 0;

  if (!hasResults) {
    return (
      <div className={styles.emptyState}>
        <UIText kind="body/regular" color="var(--neutral-500)">
          No tokens found
        </UIText>
      </div>
    );
  }

  const selectChain = (fungible: Fungible) => {
    if (chain && fungible.implementations[chain]) {
      return chain;
    }
    const chains = Object.keys(fungible.implementations);
    return chains[0] || chain || '';
  };

  return (
    <>
      {popular.length > 0 ? (
        <>
          <div className={styles.sectionHeader}>
            <UIText kind="small/accent" color="var(--neutral-500)">
              Popular
            </UIText>
          </div>
          {popular.map((fungible) => (
            <TokenRow
              key={fungible.id}
              fungible={fungible}
              chainIconUrl=""
              chainName=""
              fiatValue={null}
              tokenQuantity={null}
              currency={currency}
              onSelect={() => onSelect(fungible, selectChain(fungible))}
            />
          ))}
        </>
      ) : null}
      {others.length > 0 ? (
        <>
          <div className={styles.sectionHeader}>
            <UIText kind="small/accent" color="var(--neutral-500)">
              Others
            </UIText>
          </div>
          {others.map((fungible) => (
            <TokenRow
              key={fungible.id}
              fungible={fungible}
              chainIconUrl=""
              chainName=""
              fiatValue={null}
              tokenQuantity={null}
              currency={currency}
              onSelect={() => onSelect(fungible, selectChain(fungible))}
            />
          ))}
        </>
      ) : null}
    </>
  );
}

function SearchResults({
  query,
  chain,
  currency,
  onSelect,
}: {
  query: string;
  chain: string | null;
  currency: string;
  onSelect: (fungible: Fungible, chainId: string) => void;
}) {
  const { fungibles } = useSearchQueryFungibles({
    query,
    currency,
    chain: chain || undefined,
    limit: 50,
  });

  if (!fungibles || fungibles.length === 0) {
    return (
      <div className={styles.emptyState}>
        <UIText kind="body/regular" color="var(--neutral-500)">
          No tokens found
        </UIText>
      </div>
    );
  }

  return (
    <>
      {fungibles.map((fungible) => {
        const chainId =
          chain && fungible.implementations[chain]
            ? chain
            : Object.keys(fungible.implementations)[0] || '';
        return (
          <TokenRow
            key={fungible.id}
            fungible={fungible}
            chainIconUrl=""
            chainName=""
            fiatValue={null}
            tokenQuantity={null}
            currency={currency}
            onSelect={() => onSelect(fungible, chainId)}
          />
        );
      })}
    </>
  );
}

export function ReceivePositionSelector({
  positions,
  networks,
  currentChain,
  onSelect,
  open,
  onClose,
}: {
  positions: FungiblePosition[];
  networks: Networks;
  currentChain: string | undefined;
  onSelect: (fungible: Fungible, chainId: string) => void;
  open: boolean;
  onClose: () => void;
}) {
  const { currency } = useCurrency();
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selectedNetwork, setSelectedNetwork] = useState<string | null>(
    currentChain || null
  );
  const networkSelector = useDialog2();
  const comboboxRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setSelectedNetwork(currentChain || null);
      setDebouncedQuery('');
    }
  }, [open, currentChain]);

  const topNetworks = useTopNetworks(positions, selectedNetwork);

  const debouncedSetQuery = useDebouncedCallback(
    (value: string) => setDebouncedQuery(value),
    300
  );

  return (
    <Dialog2 open={open} onClose={onClose} title="Receive">
      <ComboboxProvider
        resetValueOnHide
        setValue={(value) => {
          debouncedSetQuery(value);
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
              {debouncedQuery ? (
                <SearchResults
                  query={debouncedQuery}
                  chain={selectedNetwork}
                  currency={currency}
                  onSelect={(fungible, chainId) => {
                    onSelect(fungible, chainId);
                    onClose();
                  }}
                />
              ) : (
                <ReceiveFungiblesList
                  chain={selectedNetwork}
                  currency={currency}
                  onSelect={(fungible, chainId) => {
                    onSelect(fungible, chainId);
                    onClose();
                  }}
                />
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
        mode="receive"
        onSelect={(chainId) => {
          setSelectedNetwork(chainId);
          networkSelector.closeDialog();
          requestAnimationFrame(() => comboboxRef.current?.focus());
        }}
      />
    </Dialog2>
  );
}
