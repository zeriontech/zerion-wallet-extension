import React, { useState } from 'react';
import { HStack } from 'src/ui/ui-kit/HStack';
import { TokenIcon } from 'src/ui/ui-kit/TokenIcon';
import { UIText } from 'src/ui/ui-kit/UIText';
import LinkIcon from 'jsx:src/ui/assets/new-window.svg';
import ChainsIcon from 'jsx:src/ui/assets/pie-chart.svg';
import {
  formatCurrencyToParts,
  formatCurrencyValue,
} from 'src/shared/units/formatCurrencyValue';
import { emDash, middot, minus } from 'src/ui/shared/typography';
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
import { useWalletPortfolio } from 'src/modules/zerion-api/hooks/useWalletPortfolio';
import { useHttpClientSource } from 'src/modules/zerion-api/hooks/useHttpClientSource';
import { UnstyledButton } from 'src/ui/ui-kit/UnstyledButton';
import ArrowDownIcon from 'jsx:src/ui/assets/caret-down-filled.svg';

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

function StatLine({
  title,
  value,
  valueColor,
}: {
  title: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <HStack gap={16} justifyContent="space-between" alignItems="center">
      <UIText kind="body/regular">{title}</UIText>
      <UIText kind="body/accent" color={valueColor}>
        {value}
      </UIText>
    </HStack>
  );
}

function getColor(value?: number) {
  return !value
    ? 'var(--black)'
    : value > 0
    ? 'var(--positive-500)'
    : 'var(--negative-500)';
}

function getSign(value?: number) {
  return !value ? '' : value > 0 ? '+' : minus;
}

export function AssetAddressDetails({
  address,
  assetFullInfo,
  walletAssetDetails,
}: {
  address: string;
  assetFullInfo: AssetFullInfo;
  walletAssetDetails: WalletAssetDetails;
}) {
  const { currency } = useCurrency();
  const [showNetworkDistribution, setShowNetworkDistribution] = useState(false);

  const { data: portfolioData } = useWalletPortfolio(
    {
      addresses: [address],
      currency,
      nftPriceType: 'not_included',
    },
    { source: useHttpClientSource() }
  );

  const totalEquityPercentage = portfolioData?.data.totalValue
    ? (walletAssetDetails.totalValue / portfolioData.data.totalValue) * 100
    : null;

  const return24h =
    assetFullInfo.fungible.meta.relativeChange1d *
    assetFullInfo.fungible.meta.price;
  const relativeReturn24h = assetFullInfo.fungible.meta.relativeChange1d;

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
            {totalEquityPercentage ? (
              <UIText
                kind="caption/accent"
                style={{
                  padding: '4px 6px',
                  backgroundColor: 'var(--neutral-200)',
                  borderRadius: 8,
                }}
              >
                {formatPercent(totalEquityPercentage, 'en')}%
              </UIText>
            ) : null}
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
        <VStack gap={16}>
          <StatLine
            title="24-hour Return"
            value={`${getSign(return24h)}${formatCurrencyValue(
              Math.abs(return24h || 0),
              'en',
              currency
            )} (${formatPercent(Math.abs(relativeReturn24h || 0), 'en')}%)`}
            valueColor={getColor(return24h)}
          />
          <StatLine
            title="Total PnL"
            value={`${getSign(
              walletAssetDetails.pnl?.totalPnl
            )}${formatCurrencyValue(
              Math.abs(walletAssetDetails.pnl?.totalPnl || 0),
              'en',
              currency
            )}`}
            valueColor={getColor(walletAssetDetails.pnl?.totalPnl)}
          />
          <StatLine
            title="Realised PnL"
            value={`${getSign(
              walletAssetDetails.pnl?.realizedPnl
            )}${formatCurrencyValue(
              Math.abs(walletAssetDetails.pnl?.realizedPnl || 0),
              'en',
              currency
            )}`}
            valueColor={getColor(walletAssetDetails.pnl?.realizedPnl)}
          />
          <StatLine
            title="Unrealised PnL"
            value={`${getSign(
              walletAssetDetails.pnl?.unrealizedPnl
            )}${formatCurrencyValue(
              Math.abs(walletAssetDetails.pnl?.unrealizedPnl || 0),
              'en',
              currency
            )} (${formatPercent(
              Math.abs(walletAssetDetails.pnl?.relativeUnrealizedPnl || 0),
              'en'
            )}%)`}
            valueColor={getColor(walletAssetDetails.pnl?.relativeUnrealizedPnl)}
          />
          <StatLine
            title="Invested"
            value={formatCurrencyValue(
              walletAssetDetails.pnl?.bought || 0,
              'en',
              currency
            )}
          />
          <StatLine
            title="Average Cost"
            value={formatCurrencyValue(
              walletAssetDetails.pnl?.averageBuyPrice || 0,
              'en',
              currency
            )}
          />
          <VStack gap={0}>
            <UnstyledButton
              className="parent-hover"
              style={{
                position: 'relative',
                ['--parent-hovered-content-background-color' as string]:
                  'var(--neutral-200)',
              }}
              onClick={() => setShowNetworkDistribution((prev) => !prev)}
            >
              <div
                className="content-hover"
                style={{
                  position: 'absolute',
                  inset: '-8px -12px',
                  borderRadius: 12,
                }}
              />
              <HStack
                gap={12}
                alignItems="center"
                justifyContent="space-between"
                style={{ position: 'relative' }}
              >
                <HStack gap={8} alignItems="center">
                  <ChainsIcon style={{ width: 16, height: 16 }} />
                  <UIText kind="body/regular">Network Distribution</UIText>
                </HStack>
                <ArrowDownIcon
                  style={{
                    width: 24,
                    height: 24,
                    transformOrigin: 'center',
                    transitionDuration: '0.2s',
                    transform: showNetworkDistribution
                      ? 'rotate(180deg)'
                      : 'rotate(0deg)',
                  }}
                />
              </HStack>
            </UnstyledButton>
            <div
              style={{
                overflow: 'hidden',
                maxHeight: showNetworkDistribution
                  ? walletAssetDetails.chainsDistribution.length * 40
                  : 0,
                transition: 'max-height 0.3s ease-in-out',
              }}
            >
              <VStack gap={16} style={{ paddingTop: 16 }}>
                {walletAssetDetails.chainsDistribution.map(
                  ({ chain, percentageAllocation, value }) => (
                    <HStack
                      key={chain.id}
                      gap={12}
                      justifyContent="space-between"
                      alignItems="center"
                    >
                      <HStack gap={8} alignItems="center">
                        <img
                          src={chain.iconUrl}
                          alt={chain.name}
                          width={16}
                          height={16}
                        />
                        <HStack gap={4} alignItems="center">
                          <UIText kind="body/regular">{chain.name}</UIText>
                          <UIText
                            kind="caption/regular"
                            color="var(--neutral-500)"
                          >
                            {`${middot} ${formatPercent(
                              percentageAllocation,
                              'en'
                            )}%`}
                          </UIText>
                        </HStack>
                      </HStack>
                      <UIText kind="body/accent">
                        {formatCurrencyValue(value, 'en', currency)}
                      </UIText>
                    </HStack>
                  )
                )}
              </VStack>
            </div>
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
                      <ChainsIcon style={{ width: 16, height: 16 }} />
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
