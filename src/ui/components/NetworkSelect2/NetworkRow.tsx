import React from 'react';
import { ComboboxItem } from '@ariakit/react';
import type { Chain } from 'src/modules/networks/Chain';
import { createChain } from 'src/modules/networks/Chain';
import { NetworkSelectValue } from 'src/modules/networks/NetworkSelectValue';
import { UIText } from 'src/ui/ui-kit/UIText';
import { BlurrableBalance } from 'src/ui/components/BlurrableBalance';
import { NetworkIcon } from 'src/ui/components/NetworkIcon';
import { useCurrency } from 'src/modules/currency/useCurrency';
import { useNativeBalance } from 'src/ui/shared/requests/useNativeBalance';
import { formatCurrencyValue } from 'src/shared/units/formatCurrencyValue';
import { formatTokenValue } from 'src/shared/units/formatTokenValue';
import { isMatchForEcosystem } from 'src/shared/wallet/shared';
import type { BlockchainType } from 'src/shared/wallet/classifiers';
import AllNetworksIcon from 'jsx:src/ui/assets/all-networks.svg';
import type { NetworkSelectDistribution } from './types';
import * as styles from './styles.module.css';

const TEN_MINUTES = 1000 * 60 * 10;

function NativeBalance({ address, chain }: { address: string; chain: Chain }) {
  const { data: balance } = useNativeBalance({
    address,
    chain,
    suspense: false,
    staleTime: TEN_MINUTES,
  });
  if (balance?.valueCommon == null) {
    return null;
  }
  const { valueCommon, position } = balance;
  return <span>{formatTokenValue(valueCommon, position?.asset.symbol)}</span>;
}

export function NetworkRow({
  value,
  name,
  iconUrl,
  selected,
  onSelect,
  chainDistribution,
  address,
  ecosystem,
}: {
  value: string;
  name: string;
  iconUrl?: string | null;
  selected: boolean;
  onSelect: (value: string) => void;
  chainDistribution: NetworkSelectDistribution | null;
  address?: string;
  ecosystem?: BlockchainType;
}) {
  const { currency } = useCurrency();
  const isAll = value === NetworkSelectValue.All;
  const preferChainDistribution =
    isAll || value in (chainDistribution?.chains || {});
  const chain = isAll ? null : createChain(value);
  const showFallback =
    !preferChainDistribution &&
    Boolean(address && chain) &&
    !(address && ecosystem && !isMatchForEcosystem(address, ecosystem));

  return (
    <ComboboxItem
      value={name}
      focusOnHover
      setValueOnClick={false}
      onClick={() => onSelect(value)}
      className={styles.row}
    >
      {isAll || !iconUrl ? (
        <AllNetworksIcon
          style={{ width: 24, height: 24, flexShrink: 0 }}
          role="presentation"
        />
      ) : (
        <NetworkIcon size={24} src={iconUrl} name={name} />
      )}
      <div className={styles.rowMain}>
        <UIText
          kind="body/accent"
          color={selected ? 'var(--primary)' : 'var(--black)'}
        >
          {name}
        </UIText>
      </div>
      <BlurrableBalance
        kind="small/regular"
        color={selected ? 'var(--primary)' : 'var(--neutral-500)'}
      >
        <UIText
          kind="small/regular"
          color={selected ? 'var(--primary)' : 'var(--neutral-500)'}
          className={styles.rowValue}
        >
          {preferChainDistribution ? (
            formatCurrencyValue(
              (isAll
                ? chainDistribution?.totalValue
                : chainDistribution?.positionsChainsDistribution[value]) || 0,
              'en',
              currency
            )
          ) : showFallback && address && chain ? (
            <NativeBalance address={address} chain={chain} />
          ) : null}
        </UIText>
      </BlurrableBalance>
    </ComboboxItem>
  );
}
