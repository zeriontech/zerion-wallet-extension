import React, { startTransition, useMemo, useState } from 'react';
import {
  ComboboxProvider,
  Combobox,
  ComboboxList,
  ComboboxItem,
} from '@ariakit/react';
import type { Networks } from 'src/modules/networks/Networks';
import type { FungiblePosition } from 'src/modules/zerion-api/requests/wallet-get-simple-positions';
import { NetworkIcon } from 'src/ui/components/NetworkIcon';
import { UIText } from 'src/ui/ui-kit/UIText';
import { SearchInput } from 'src/ui/ui-kit/Input/SearchInput';
import { filterAndSortNetworksByQuery } from 'src/modules/ethereum/chains/filterNetworkByQuery';
import { Dialog2 } from 'src/ui/ui-kit/ModalDialogs/Dialog2';
import * as styles from './styles.module.css';

export function NetworkSelectorDialog({
  open,
  onClose,
  networks,
  positions,
  mode,
  onSelect,
}: {
  open: boolean;
  onClose: () => void;
  networks: Networks;
  positions: FungiblePosition[];
  mode: 'spend' | 'receive';
  onSelect: (chainId: string) => void;
}) {
  const [searchValue, setSearchValue] = useState('');

  const networkList = useMemo(() => {
    if (mode === 'spend') {
      const chainIds = new Set(positions.map((p) => p.chain.id));
      return networks
        .getNetworks()
        .filter((n) => chainIds.has(n.id) && !n.is_testnet);
    }
    return networks
      .getNetworks()
      .filter(
        (n) => !n.is_testnet && (n.supports_trading || n.supports_bridging)
      );
  }, [networks, positions, mode]);

  const filteredNetworks = useMemo(() => {
    if (!searchValue) {
      return networkList;
    }
    return filterAndSortNetworksByQuery(networkList, searchValue);
  }, [networkList, searchValue]);

  return (
    <Dialog2 open={open} onClose={onClose} title="Select Network">
      <ComboboxProvider
        resetValueOnHide
        setValue={(value) => {
          startTransition(() => setSearchValue(value));
        }}
      >
        <div className={styles.searchWrapper}>
          <Combobox render={<SearchInput placeholder="Search networks" />} />
        </div>
        <ComboboxList alwaysVisible className={styles.tokenList}>
          {filteredNetworks.length === 0 ? (
            <div className={styles.emptyState}>
              <UIText kind="body/regular" color="var(--neutral-500)">
                No networks found
              </UIText>
            </div>
          ) : (
            filteredNetworks.map((network) => (
              <ComboboxItem
                key={network.id}
                value={network.name}
                focusOnHover
                setValueOnClick={false}
                onClick={() => onSelect(network.id)}
                className={styles.tokenRow}
              >
                <NetworkIcon
                  src={network.icon_url}
                  name={network.name}
                  size={32}
                  style={{ borderRadius: 8 }}
                />
                <div className={styles.tokenInfo}>
                  <UIText kind="body/accent">{network.name}</UIText>
                </div>
              </ComboboxItem>
            ))
          )}
        </ComboboxList>
      </ComboboxProvider>
    </Dialog2>
  );
}
