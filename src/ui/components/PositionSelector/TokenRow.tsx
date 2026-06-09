import React from 'react';
import { ComboboxItem } from '@ariakit/react';
import { TokenIcon } from 'src/ui/ui-kit/TokenIcon';
import { NetworkIcon } from 'src/ui/components/NetworkIcon';
import { UIText } from 'src/ui/ui-kit/UIText';
import { formatCurrencyValue } from 'src/shared/units/formatCurrencyValue/formatCurrencyValue';
import { formatTokenValue } from 'src/shared/units/formatTokenValue';
import type { Fungible } from 'src/modules/zerion-api/types/Fungible';
import { useNetworks } from 'src/modules/networks/useNetworks';
import { createChain } from 'src/modules/networks/Chain';
import { HStack } from 'src/ui/ui-kit/HStack';
import GasIcon from 'jsx:src/ui/assets/gas.svg';
import VerifiedIcon from 'jsx:src/ui/assets/verified.svg';
import * as styles from './styles.module.css';

function formatMarketCap(value: number | null): string | null {
  if (value == null) {
    return null;
  }
  if (value >= 1e9) {
    return `$${(value / 1e9).toFixed(1)}B`;
  }
  if (value >= 1e6) {
    return `$${(value / 1e6).toFixed(1)}M`;
  }
  if (value >= 1e3) {
    return `$${(value / 1e3).toFixed(1)}K`;
  }
  return `$${value.toFixed(0)}`;
}

export function TokenRow({
  fungible,
  chainId,
  chainIconUrl,
  chainName,
  fiatValue,
  tokenQuantity,
  currency,
  onSelect,
}: {
  fungible: Fungible;
  chainId: string;
  chainIconUrl: string;
  chainName: string;
  fiatValue: number | null;
  tokenQuantity: string | null;
  currency: string;
  onSelect: () => void;
}) {
  const { networks } = useNetworks();
  const isGasAsset =
    networks?.getNetworkByName(createChain(chainId))?.native_asset?.id ===
    fungible.id;
  const marketCap = fungible.meta.marketCap;
  const fullyDilutedValuation = fungible.meta.fullyDilutedValuation;
  const mcap = formatMarketCap(marketCap);
  const fdv = formatMarketCap(fullyDilutedValuation);
  const showFdv =
    fdv != null &&
    (marketCap == null ||
      fullyDilutedValuation == null ||
      marketCap === 0 ||
      Math.abs(fullyDilutedValuation - marketCap) / marketCap > 0.3);
  const metaParts: { label: string; value: string }[] = [];
  if (mcap) {
    metaParts.push({ label: 'MCAP', value: mcap });
  }
  if (showFdv && fdv) {
    metaParts.push({ label: 'FDV', value: fdv });
  }

  return (
    <ComboboxItem
      value={`${fungible.symbol} ${fungible.name}`}
      hideOnClick
      focusOnHover
      blurOnHoverEnd={false}
      setValueOnClick={false}
      onClick={onSelect}
      className={styles.tokenRow}
    >
      <div className={styles.tokenIconWrapper}>
        <TokenIcon src={fungible.iconUrl} symbol={fungible.symbol} size={44} />
        <div className={styles.networkBadge}>
          <NetworkIcon src={chainIconUrl} name={chainName} size={16} />
        </div>
      </div>
      <div className={styles.tokenInfo}>
        <HStack
          gap={4}
          alignItems="center"
          style={{
            gridTemplateColumns: 'minmax(0, max-content) auto',
            minWidth: 0,
          }}
        >
          <UIText kind="body/accent" className={styles.tokenName}>
            {fungible.name}
          </UIText>
          {isGasAsset ? (
            <div title="Token is used to cover gas fees">
              <GasIcon style={{ display: 'block', width: 20, height: 20 }} />
            </div>
          ) : fungible.verified ? (
            <VerifiedIcon style={{ display: 'block' }} />
          ) : null}
        </HStack>
        <UIText
          kind="caption/regular"
          color="var(--neutral-500)"
          className={styles.tokenMeta}
        >
          {metaParts.length > 0
            ? metaParts.map((part, i) => (
                <React.Fragment key={part.label}>
                  {i > 0 ? ' · ' : null}
                  {part.label}{' '}
                  <UIText kind="caption/accent" as="span" color="var(--black)">
                    {part.value}
                  </UIText>
                </React.Fragment>
              ))
            : fungible.symbol}
        </UIText>
      </div>
      <div className={styles.tokenValues}>
        {fiatValue != null && fiatValue > 0 ? (
          <UIText kind="body/regular">
            {formatCurrencyValue(fiatValue, 'en', currency)}
          </UIText>
        ) : tokenQuantity != null && tokenQuantity !== '0' ? (
          <UIText kind="body/regular">&nbsp;</UIText>
        ) : null}
        {tokenQuantity != null && tokenQuantity !== '0' ? (
          <UIText kind="small/regular" color="var(--neutral-500)">
            {formatTokenValue(tokenQuantity)} {fungible.symbol}
          </UIText>
        ) : null}
      </div>
    </ComboboxItem>
  );
}
