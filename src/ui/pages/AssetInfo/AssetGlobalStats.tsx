import React from 'react';
import { useCurrency } from 'src/modules/currency/useCurrency';
import type { AssetFullInfo } from 'src/modules/zerion-api/requests/asset-get-fungible-full-info';
import { formatCurrencyValue } from 'src/shared/units/formatCurrencyValue';
import { formatPercent } from 'src/shared/units/formatPercent/formatPercent';
import { HStack } from 'src/ui/ui-kit/HStack';
import { UIText } from 'src/ui/ui-kit/UIText';

const ONE_DAY = 24 * 60 * 60 * 1000;
const ONE_HOUR = 60 * 60 * 1000;

function AssetStatsChip({
  title,
  fullTitle,
  value,
}: {
  title: string;
  fullTitle?: string;
  value: string;
}) {
  return (
    <HStack
      gap={4}
      style={{
        backgroundColor: 'var(--neutral-200)',
        padding: '6px 8px',
        borderRadius: 8,
      }}
      title={fullTitle}
    >
      <UIText kind="caption/accent" color="var(--neutral-500)">
        {title}
      </UIText>
      <UIText kind="caption/accent">{value}</UIText>
    </HStack>
  );
}

const FORMATTING_OPTIONS: Intl.NumberFormatOptions = {
  notation: 'compact',
  maximumFractionDigits: 1,
};

const numberFormatter = Intl.NumberFormat('en', FORMATTING_OPTIONS);

export function AssetGlobalStats({
  assetFullInfo,
}: {
  assetFullInfo: AssetFullInfo;
}) {
  const { currency } = useCurrency();

  const createdRecently =
    Date.now() - new Date(assetFullInfo.extra.createdAt).getTime() < ONE_DAY;
  const ageInHours = Math.floor(
    (Date.now() - new Date(assetFullInfo.extra.createdAt).getTime()) / ONE_HOUR
  );

  return (
    <HStack gap={8} style={{ width: '100%', overflowX: 'auto' }}>
      {createdRecently ? (
        <AssetStatsChip title="AGE" value={`${ageInHours}h`} />
      ) : null}
      {assetFullInfo.fungible.meta.fullyDilutedValuation != null ? (
        <AssetStatsChip
          title="FDV"
          fullTitle="Fully Diluted Valuation"
          value={formatCurrencyValue(
            assetFullInfo.fungible.meta.fullyDilutedValuation,
            'en',
            currency,
            FORMATTING_OPTIONS
          )}
        />
      ) : null}
      {assetFullInfo.fungible.meta.marketCap != null ? (
        <AssetStatsChip
          title="MCAP"
          fullTitle="Market Capitalization"
          value={formatCurrencyValue(
            assetFullInfo.fungible.meta.marketCap,
            'en',
            currency,
            FORMATTING_OPTIONS
          )}
        />
      ) : null}
      {assetFullInfo.extra.volume24h ? (
        <AssetStatsChip
          title="VOL"
          fullTitle="Volume 24h"
          value={formatCurrencyValue(
            assetFullInfo.extra.volume24h,
            'en',
            currency,
            FORMATTING_OPTIONS
          )}
        />
      ) : null}
      {assetFullInfo.extra.holders ? (
        <AssetStatsChip
          title="HLDRS"
          fullTitle="Holders"
          value={numberFormatter.format(assetFullInfo.extra.holders)}
        />
      ) : null}
      {assetFullInfo.extra.top10 ? (
        <AssetStatsChip
          title="TOP10"
          fullTitle="Top 10 Holders Share"
          value={`${formatPercent(assetFullInfo.extra.top10, 'en')}%`}
        />
      ) : null}
      {assetFullInfo.extra.liquidity ? (
        <AssetStatsChip
          title="LIQ"
          fullTitle="Liquidity"
          value={formatCurrencyValue(
            assetFullInfo.extra.liquidity,
            'en',
            currency,
            FORMATTING_OPTIONS
          )}
        />
      ) : null}
    </HStack>
  );
}
