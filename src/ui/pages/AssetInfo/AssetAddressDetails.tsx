import React from 'react';
import { HStack } from 'src/ui/ui-kit/HStack';
import { TokenIcon } from 'src/ui/ui-kit/TokenIcon';
import { UIText } from 'src/ui/ui-kit/UIText';
import LinkIcon from 'jsx:src/ui/assets/new-window.svg';
import ChainsIcon from 'jsx:src/ui/assets/pie-chart.svg';
import {
  formatCurrencyToParts,
  formatCurrencyValue,
} from 'src/shared/units/formatCurrencyValue';
import { emDash, middot } from 'src/ui/shared/typography';
import { useCurrency } from 'src/modules/currency/useCurrency';
import WalletIcon from 'jsx:src/ui/assets/wallet-fancy.svg';
import type {
  Asset,
  AssetFullInfo,
} from 'src/modules/zerion-api/requests/asset-get-fungible-full-info';
import { VStack } from 'src/ui/ui-kit/VStack';
import type { WalletAssetDetails } from 'src/modules/zerion-api/requests/wallet-get-asset-details';
import { UnstyledAnchor } from 'src/ui/ui-kit/UnstyledAnchor';
import { formatPercent } from 'src/shared/units/formatPercent/formatPercent';
import { formatTokenValue } from 'src/shared/units/formatTokenValue';
import { NeutralDecimals } from 'src/ui/ui-kit/NeutralDecimals';

export function AssetHeader({
  asset,
  className,
}: {
  asset: Asset;
  className?: string;
}) {
  const { currency } = useCurrency();
  return (
    <HStack
      gap={8}
      alignItems="center"
      justifyContent="center"
      className={className}
    >
      <TokenIcon
        src={asset.iconUrl}
        symbol={asset.symbol}
        size={20}
        title={asset.name}
      />
      <UIText kind="body/accent">
        {asset.symbol} {emDash}{' '}
        {formatCurrencyValue(asset.meta.price || 0, 'en', currency)}
      </UIText>
    </HStack>
  );
}

function Line() {
  return (
    <div
      style={{
        width: '100%',
        height: 2,
        backgroundColor: 'var(--neutral-200)',
      }}
    />
  );
}

const DEFAULT_APP_ID = 'wallet';

export function AssetAddressDetails({
  assetFullInfo,
  walletAssetDetails,
}: {
  assetFullInfo: AssetFullInfo;
  walletAssetDetails: WalletAssetDetails;
}) {
  const { currency } = useCurrency();

  return (
    <VStack
      gap={14}
      style={{
        paddingTop: 6,
        ['--surface-background-color' as string]: 'var(--white)',
      }}
    >
      <AssetHeader asset={assetFullInfo.fungible} />
      <VStack gap={24}>
        <VStack gap={12}>
          <HStack gap={8} alignItems="center">
            <UIText kind="small/accent">Equity</UIText>
          </HStack>
          <VStack gap={4}>
            <UIText kind="headline/h1">
              <NeutralDecimals
                parts={formatCurrencyToParts(
                  walletAssetDetails.totalValue,
                  'en',
                  currency
                )}
              />
            </UIText>
            <UIText kind="small/regular" color="var(--neutral-500)">
              {formatTokenValue(
                walletAssetDetails.totalConvertedQuantity,
                assetFullInfo.fungible.symbol
              )}
            </UIText>
          </VStack>
        </VStack>
        <Line />
        {walletAssetDetails.apps.map((app) => (
          <UnstyledAnchor
            key={app.app.id}
            href={app.app.url || ''}
            target="_blank"
            rel="noreferrer"
            className="parent-hover"
            style={{
              width: '100%',
              ['--parent-content-color' as string]: 'var(--neutral-500)',
              ['--parent-hovered-content-color' as string]: 'var(--black)',
            }}
          >
            <HStack gap={12} justifyContent="space-between" alignItems="center">
              <HStack gap={12} alignItems="center">
                {app.app.id === DEFAULT_APP_ID ? (
                  <WalletIcon style={{ width: 36, height: 36 }} />
                ) : (
                  <TokenIcon
                    src={app.app.iconUrl}
                    symbol={app.app.name}
                    size={36}
                    style={{ borderRadius: 8 }}
                  />
                )}
                <VStack gap={0}>
                  <HStack gap={4} alignItems="center">
                    <UIText kind="small/regular" color="var(--nuetral-800)">
                      {app.app.name}
                    </UIText>
                    <UIText kind="caption/regular" color="var(--neutral-500)">
                      {`${middot} ${formatPercent(
                        app.percentageAllocation,
                        'en'
                      )}%`}
                    </UIText>
                  </HStack>
                  <HStack gap={4} alignItems="center">
                    {app.chains.length === 1 ? (
                      <img
                        src={app.chains[0].iconUrl}
                        alt={app.chains[0].name}
                        width={16}
                        height={16}
                      />
                    ) : (
                      <ChainsIcon />
                    )}
                    <UIText kind="body/accent">
                      <NeutralDecimals
                        parts={formatCurrencyToParts(app.value, 'en', currency)}
                      />
                    </UIText>
                    <UIText kind="body/regular" color="var(--neutral-500)">
                      (
                      {formatTokenValue(
                        app.convertedQuantity,
                        assetFullInfo.fungible.symbol
                      )}
                      )
                    </UIText>
                  </HStack>
                </VStack>
              </HStack>
              {app.app.url ? <LinkIcon className="content-hover" /> : null}
            </HStack>
          </UnstyledAnchor>
        ))}
        <Line />
        <VStack gap={12}>
          <UIText kind="headline/h3">
            About {assetFullInfo.fungible.name}
          </UIText>
          <UIText kind="body/regular">{assetFullInfo.extra.description}</UIText>
        </VStack>
      </VStack>
    </VStack>
  );
}
