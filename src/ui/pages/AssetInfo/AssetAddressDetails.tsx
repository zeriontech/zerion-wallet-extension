import React, { useRef, useState } from 'react';
import type { UseQueryResult } from '@tanstack/react-query';
import { HStack } from 'src/ui/ui-kit/HStack';
import { TokenIcon } from 'src/ui/ui-kit/TokenIcon';
import { UIText } from 'src/ui/ui-kit/UIText';
import LinkIcon from 'jsx:src/ui/assets/new-window.svg';
import ChainsIcon from 'jsx:src/ui/assets/pie-chart.svg';
import {
  formatCurrencyToParts,
  formatCurrencyValue,
} from 'src/shared/units/formatCurrencyValue';
import { middot } from 'src/ui/shared/typography';
import { useCurrency } from 'src/modules/currency/useCurrency';
import WalletIcon from 'jsx:src/ui/assets/wallet-fancy.svg';
import EyeIcon from 'jsx:src/ui/assets/eye.svg';
import ArrowLeftIcon from 'jsx:src/ui/assets/arrow-left.svg';
import type { AssetFullInfo } from 'src/modules/zerion-api/requests/asset-get-fungible-full-info';
import { VStack } from 'src/ui/ui-kit/VStack';
import type { WalletAssetDetails } from 'src/modules/zerion-api/requests/wallet-get-asset-details';
import { UnstyledAnchor } from 'src/ui/ui-kit/UnstyledAnchor';
import { formatPercent } from 'src/shared/units/formatPercent';
import { formatTokenValue } from 'src/shared/units/formatTokenValue';
import { NeutralDecimals } from 'src/ui/ui-kit/NeutralDecimals';
import { useWalletPortfolio } from 'src/modules/zerion-api/hooks/useWalletPortfolio';
import { useHttpClientSource } from 'src/modules/zerion-api/hooks/useHttpClientSource';
import { UnstyledButton } from 'src/ui/ui-kit/UnstyledButton';
import ArrowDownIcon from 'jsx:src/ui/assets/caret-down-filled.svg';
import type { ExternallyOwnedAccount } from 'src/shared/types/ExternallyOwnedAccount';
import { isReadonlyAccount } from 'src/shared/types/validators';
import type { HTMLDialogElementInterface } from 'src/ui/ui-kit/ModalDialogs/HTMLDialogElementInterface';
import { WalletDisplayName } from 'src/ui/components/WalletDisplayName';
import { WalletAvatar } from 'src/ui/components/WalletAvatar';
import { UnstyledLink } from 'src/ui/ui-kit/UnstyledLink';
import { Button } from 'src/ui/ui-kit/Button';
import { CenteredDialog } from 'src/ui/ui-kit/ModalDialogs/CenteredDialog';
import type { AssetAddressPnl } from 'src/modules/zerion-api/requests/asset-get-fungible-pnl';
import { formatPriceValue } from 'src/shared/units/formatPriceValue';
import type { ResponseBody } from 'src/modules/zerion-api/requests/ResponseBody';
import { AssetHeader } from './AssetHeader';
import { getColor, getSign } from './helpers';

type AssetAddressPnlQuery = UseQueryResult<ResponseBody<AssetAddressPnl>>;

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

function LoadingSkeleton() {
  return <div style={{ width: 100, height: 24 }} />;
}

const DEFAULT_APP_ID = 'wallet';

function AssetDetailsTitle({
  address,
  assetFullInfo,
  walletAssetDetails,
}: {
  address: string;
  assetFullInfo: AssetFullInfo;
  walletAssetDetails: WalletAssetDetails;
}) {
  const { currency } = useCurrency();
  const { data: portfolioData } = useWalletPortfolio(
    {
      addresses: [address],
      currency,
      nftPriceType: 'not_included',
    },
    { source: useHttpClientSource() }
  );
  const isUntrackedAsset = assetFullInfo.fungible.meta.price == null;

  const totalEquityPercentage = portfolioData?.data.totalValue
    ? (walletAssetDetails.totalValue / portfolioData.data.totalValue) * 100
    : null;

  return (
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
        <UIText
          kind="headline/h1"
          color={isUntrackedAsset ? 'var(--neutral-500)' : undefined}
        >
          {isUntrackedAsset ? (
            'N/A'
          ) : (
            <NeutralDecimals
              parts={formatCurrencyToParts(
                walletAssetDetails.totalValue,
                'en',
                currency
              )}
            />
          )}
        </UIText>
        <UIText kind="small/regular" color="var(--neutral-500)">
          {formatTokenValue(
            walletAssetDetails.totalConvertedQuantity,
            assetFullInfo.fungible.symbol
          )}
        </UIText>
      </VStack>
    </VStack>
  );
}

function StatLine({
  title,
  isLoading,
  value,
  valueColor,
}: {
  title: string;
  isLoading?: boolean;
  value: string;
  valueColor?: string;
}) {
  return (
    <HStack gap={16} justifyContent="space-between" alignItems="center">
      <UIText kind="body/regular">{title}</UIText>
      {isLoading ? (
        <LoadingSkeleton />
      ) : (
        <UIText kind="body/accent" color={valueColor}>
          {value}
        </UIText>
      )}
    </HStack>
  );
}

function AssetStats({
  assetFullInfo,
  assetAddressPnlQuery,
}: {
  assetFullInfo: AssetFullInfo;
  assetAddressPnlQuery: AssetAddressPnlQuery;
}) {
  const { currency } = useCurrency();
  const { data, isLoading } = assetAddressPnlQuery;
  const assetAddressPnl = data?.data;

  const isUntrackedAsset = assetFullInfo.fungible.meta.price == null;
  const return24h =
    assetFullInfo.fungible.meta.relativeChange1d != null &&
    assetFullInfo.fungible.meta.price != null
      ? assetFullInfo.fungible.meta.relativeChange1d *
        assetFullInfo.fungible.meta.price
      : null;
  const relativeReturn24h = assetFullInfo.fungible.meta.relativeChange1d;

  if (isUntrackedAsset) {
    return null;
  }

  return (
    <VStack gap={16}>
      <StatLine
        title="24-hour Return"
        value={
          return24h != null
            ? `${getSign(return24h)}${formatPercent(
                Math.abs(relativeReturn24h || 0),
                'en'
              )}% (${formatCurrencyValue(
                Math.abs(return24h || 0),
                'en',
                currency
              )})`
            : 'N/A'
        }
        valueColor={return24h != null ? getColor(return24h) : undefined}
      />
      <StatLine
        title="Total PnL"
        value={`${getSign(assetAddressPnl?.totalPnl)}${formatPercent(
          Math.abs(assetAddressPnl?.relativeTotalPnl || 0),
          'en'
        )}% (${formatCurrencyValue(
          Math.abs(assetAddressPnl?.totalPnl || 0),
          'en',
          currency
        )})`}
        valueColor={getColor(assetAddressPnl?.totalPnl)}
        isLoading={isLoading}
      />
      <StatLine
        title="Realised PnL"
        value={`${getSign(assetAddressPnl?.realizedPnl)}${formatPercent(
          Math.abs(assetAddressPnl?.relativeRealizedPnl || 0),
          'en'
        )}% (${formatCurrencyValue(
          Math.abs(assetAddressPnl?.realizedPnl || 0),
          'en',
          currency
        )})`}
        valueColor={getColor(assetAddressPnl?.realizedPnl)}
        isLoading={isLoading}
      />
      <StatLine
        title="Unrealised PnL"
        value={`${getSign(assetAddressPnl?.unrealizedPnl)}${formatPercent(
          Math.abs(assetAddressPnl?.relativeUnrealizedPnl || 0),
          'en'
        )}% (${formatCurrencyValue(
          Math.abs(assetAddressPnl?.unrealizedPnl || 0),
          'en',
          currency
        )})`}
        valueColor={getColor(assetAddressPnl?.relativeUnrealizedPnl)}
        isLoading={isLoading}
      />
      <StatLine
        title="Invested"
        value={formatCurrencyValue(
          assetAddressPnl?.bought || 0,
          'en',
          currency
        )}
        isLoading={isLoading}
      />
      <StatLine
        title="Average Cost"
        value={formatPriceValue(
          assetAddressPnl?.averageBuyPrice || 0,
          'en',
          currency
        )}
        isLoading={isLoading}
      />
    </VStack>
  );
}

function AssetNetworkDistribution({
  walletAssetDetails,
}: {
  walletAssetDetails: WalletAssetDetails;
}) {
  const { currency } = useCurrency();
  const [showNetworkDistribution, setShowNetworkDistribution] = useState(false);

  return (
    <VStack gap={0}>
      <div
        className="parent-hover"
        style={{
          position: 'relative',
          display: 'flex',
          ['--parent-hovered-content-background-color' as string]:
            'var(--neutral-200)',
        }}
      >
        <div
          className="content-hover"
          style={{
            position: 'absolute',
            inset: '-8px -12px',
            borderRadius: 12,
          }}
        />
        <UnstyledButton
          style={{ position: 'relative', width: '100%' }}
          onClick={() => setShowNetworkDistribution((prev) => !prev)}
        >
          <HStack
            gap={12}
            alignItems="center"
            justifyContent="space-between"
            style={{ position: 'relative' }}
          >
            <HStack gap={8} alignItems="center">
              <ChainsIcon style={{ width: 24, height: 24 }} />
              <UIText kind="body/accent">Network Distribution</UIText>
            </HStack>
            <ArrowDownIcon
              style={{
                width: 24,
                height: 24,
                transformOrigin: 'center',
                transitionDuration: '0.2s',
                transform: showNetworkDistribution
                  ? 'rotate(0deg)'
                  : 'rotate(90deg)',
              }}
            />
          </HStack>
        </UnstyledButton>
      </div>

      <div
        style={{
          overflow: 'hidden',
          maxHeight: showNetworkDistribution
            ? (walletAssetDetails.chainsDistribution?.length || 0) * 40
            : 0,
          transition: 'max-height 0.3s ease-in-out',
        }}
      >
        <VStack gap={16} style={{ paddingTop: 16 }}>
          {walletAssetDetails.chainsDistribution?.map(
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
                    <UIText kind="caption/regular" color="var(--neutral-500)">
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
  );
}

function AssetAppDistribution({
  assetFullInfo,
  walletAssetDetails,
}: {
  assetFullInfo: AssetFullInfo;
  walletAssetDetails: WalletAssetDetails;
}) {
  const { currency } = useCurrency();
  const isUntrackedAsset = assetFullInfo.fungible.meta.price == null;

  return (
    <VStack gap={16}>
      {walletAssetDetails.apps?.map((app) => (
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
                  {isUntrackedAsset ? (
                    <UIText kind="body/accent">
                      {formatTokenValue(
                        app.convertedQuantity,
                        assetFullInfo.fungible.symbol,
                        {
                          notation:
                            app.convertedQuantity > 100000
                              ? 'compact'
                              : undefined,
                        }
                      )}
                    </UIText>
                  ) : (
                    <>
                      <UIText kind="body/accent">
                        <NeutralDecimals
                          parts={formatCurrencyToParts(
                            app.value,
                            'en',
                            currency
                          )}
                        />
                      </UIText>
                      <UIText kind="body/regular" color="var(--neutral-500)">
                        (
                        {formatTokenValue(
                          app.convertedQuantity,
                          assetFullInfo.fungible.symbol,
                          {
                            notation:
                              app.convertedQuantity > 100000
                                ? 'compact'
                                : undefined,
                          }
                        )}
                        )
                      </UIText>
                    </>
                  )}
                </HStack>
              </VStack>
            </HStack>
            {app.app.url ? <LinkIcon className="content-hover" /> : null}
          </HStack>
        </UnstyledAnchor>
      ))}
    </VStack>
  );
}

function AssetImplementationsDialogContent({
  address,
  assetFullInfo,
  walletAssetDetails,
  assetAddressPnlQuery,
}: {
  address: string;
  assetFullInfo: AssetFullInfo;
  walletAssetDetails: WalletAssetDetails;
  assetAddressPnlQuery: AssetAddressPnlQuery;
}) {
  return (
    <VStack
      gap={14}
      style={{
        padding: '8px 16px 24px',
        ['--surface-background-color' as string]: 'var(--white)',
      }}
    >
      <VStack gap={24}>
        <AssetDetailsTitle
          address={address}
          assetFullInfo={assetFullInfo}
          walletAssetDetails={walletAssetDetails}
        />
        <AssetStats
          assetFullInfo={assetFullInfo}
          assetAddressPnlQuery={assetAddressPnlQuery}
        />
        <Line />
        <AssetNetworkDistribution walletAssetDetails={walletAssetDetails} />
        <Line />
        <AssetAppDistribution
          assetFullInfo={assetFullInfo}
          walletAssetDetails={walletAssetDetails}
        />
      </VStack>
    </VStack>
  );
}

export function AssetAddressStats({
  address,
  assetFullInfo,
  wallet,
  walletAssetDetails,
  assetAddressPnlQuery,
}: {
  address: string;
  assetFullInfo: AssetFullInfo;
  wallet: ExternallyOwnedAccount;
  walletAssetDetails: WalletAssetDetails;
  assetAddressPnlQuery: AssetAddressPnlQuery;
}) {
  const dialogRef = useRef<HTMLDialogElementInterface | null>(null);
  const { currency } = useCurrency();
  const isUntrackedAsset = assetFullInfo.fungible.meta.price == null;
  const asset = assetFullInfo.fungible;

  const isWatchedAddress = isReadonlyAccount(wallet);

  const unrealizedGainRaw = assetAddressPnlQuery.data?.data.unrealizedPnl || 0;
  const unrealizedGainFormatted = `${getSign(unrealizedGainRaw)}${formatPercent(
    Math.abs(unrealizedGainRaw / walletAssetDetails.totalValue),
    'en'
  )}% (${formatCurrencyValue(Math.abs(unrealizedGainRaw), 'en', currency)})`;

  return (
    <>
      <VStack
        gap={0}
        style={{
          position: 'relative',
          border: '2px solid var(--neutral-200)',
          borderRadius: 16,
          overflow: 'hidden',
        }}
      >
        {isWatchedAddress ? (
          <HStack
            gap={8}
            alignItems="center"
            justifyContent="center"
            style={{
              backgroundColor: 'var(--neutral-200)',
              padding: '3px 0 5px',
            }}
          >
            <EyeIcon
              style={{ width: 20, height: 20, color: 'var(--neutral-500)' }}
            />
            <UIText kind="caption/accent" color="var(--neutral-500)">
              You’re following this wallet
            </UIText>
          </HStack>
        ) : null}
        <VStack gap={12} style={{ padding: 14 }}>
          <UnstyledLink
            to="/wallet-select"
            title="Change Wallet"
            className="parent-hover"
            style={{
              ['--parent-content-color' as string]: 'var(--neutral-500)',
              ['--parent-hovered-content-color' as string]: 'var(--black)',
            }}
          >
            <HStack gap={4} alignItems="center">
              <HStack gap={8} alignItems="center">
                <WalletAvatar
                  active={false}
                  address={address}
                  size={24}
                  borderRadius={4}
                />
                <WalletDisplayName
                  wallet={wallet}
                  maxCharacters={16}
                  render={(name) => (
                    <UIText kind="body/accent">{name.value}</UIText>
                  )}
                />
              </HStack>
              <ArrowDownIcon
                className="content-hover"
                style={{ width: 24, height: 24 }}
              />
            </HStack>
          </UnstyledLink>
          {walletAssetDetails.totalConvertedQuantity === 0 ? (
            <>
              {assetAddressPnlQuery.data?.data.bought === 0 ? null : (
                <UIText kind="headline/h2" color="var(--neutral-500)">
                  {isUntrackedAsset
                    ? 'N/A'
                    : formatCurrencyValue(0, 'en', currency)}
                </UIText>
              )}
              <UIText kind="small/regular" color="var(--neutral-500)">
                {formatTokenValue(0, asset.symbol)}
              </UIText>
            </>
          ) : (
            <VStack gap={12}>
              <VStack gap={4}>
                <UIText
                  kind="headline/h1"
                  color={isUntrackedAsset ? 'var(--neutral-500)' : undefined}
                >
                  {isUntrackedAsset ? (
                    'N/A'
                  ) : (
                    <NeutralDecimals
                      parts={formatCurrencyToParts(
                        walletAssetDetails.totalValue,
                        'en',
                        currency
                      )}
                    />
                  )}
                </UIText>
                <UIText kind="small/regular" color="var(--neutral-500)">
                  {formatTokenValue(
                    walletAssetDetails.totalConvertedQuantity,
                    asset.symbol
                  )}
                </UIText>
              </VStack>
              {walletAssetDetails.totalValue ? (
                <HStack
                  gap={12}
                  style={{
                    gridTemplateColumns: 'minmax(max-content, 1fr) 1fr',
                  }}
                  alignItems="start"
                >
                  <VStack gap={4}>
                    <UIText kind="caption/regular" color="var(--neutral-500)">
                      Unrealised PnL
                    </UIText>
                    {assetAddressPnlQuery.isLoading ? (
                      <LoadingSkeleton />
                    ) : (
                      <UIText
                        kind="headline/h3"
                        color={getColor(unrealizedGainRaw)}
                      >
                        {unrealizedGainFormatted}
                      </UIText>
                    )}
                  </VStack>
                  <VStack gap={4}>
                    <UIText kind="caption/regular" color="var(--neutral-500)">
                      Invested
                    </UIText>
                    {assetAddressPnlQuery.isLoading ? (
                      <LoadingSkeleton />
                    ) : (
                      <UIText kind="headline/h3">
                        {formatCurrencyValue(
                          assetAddressPnlQuery.data?.data.bought || 0,
                          'en',
                          currency
                        )}
                      </UIText>
                    )}
                  </VStack>
                </HStack>
              ) : null}
              {isUntrackedAsset ? null : (
                <Button
                  kind="neutral"
                  size={48}
                  onClick={() => dialogRef.current?.showModal()}
                  style={{
                    ['--button-background' as string]: 'var(--neutral-200)',
                    ['--button-background-hover' as string]:
                      'var(--neutral-300)',
                  }}
                >
                  <UIText kind="body/accent"> More Details</UIText>
                </Button>
              )}
            </VStack>
          )}
        </VStack>
      </VStack>
      <CenteredDialog
        ref={dialogRef}
        containerStyle={{ backgroundColor: 'var(--white)', padding: 0 }}
        renderWhenOpen={() => (
          <>
            <HStack
              gap={0}
              alignItems="center"
              style={{
                position: 'sticky',
                top: 0,
                padding: '16px 8px 0',
                zIndex: 1,
                gridTemplateColumns: '36px 1fr 36px',
                backdropFilter: 'blur(8px)',
              }}
            >
              <form
                method="dialog"
                onSubmit={(event) => event.stopPropagation()}
              >
                <Button
                  kind="ghost"
                  value="cancel"
                  size={36}
                  style={{ width: 36, padding: 8 }}
                >
                  <ArrowLeftIcon style={{ width: 20, height: 20 }} />
                </Button>
              </form>
              <AssetHeader asset={asset} />
            </HStack>
            <AssetImplementationsDialogContent
              address={wallet.address}
              assetFullInfo={assetFullInfo}
              walletAssetDetails={walletAssetDetails}
              assetAddressPnlQuery={assetAddressPnlQuery}
            />
          </>
        )}
      />
    </>
  );
}
