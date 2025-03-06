import React, { useEffect, useRef, useState } from 'react';
import { HStack } from 'src/ui/ui-kit/HStack';
import { TokenIcon } from 'src/ui/ui-kit/TokenIcon';
import { UIText } from 'src/ui/ui-kit/UIText';
import LinkIcon from 'jsx:src/ui/assets/new-window.svg';
import ChainsIcon from 'jsx:src/ui/assets/pie-chart.svg';
import {
  formatCurrencyToParts,
  formatCurrencyValue,
} from 'src/shared/units/formatCurrencyValue';
import { middot, minus } from 'src/ui/shared/typography';
import { useCurrency } from 'src/modules/currency/useCurrency';
import WalletIcon from 'jsx:src/ui/assets/wallet-fancy.svg';
import EyeIcon from 'jsx:src/ui/assets/eye.svg';
import ArrowLeftIcon from 'jsx:src/ui/assets/arrow-left.svg';
import type { AssetFullInfo } from 'src/modules/zerion-api/requests/asset-get-fungible-full-info';
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
import type { ExternallyOwnedAccount } from 'src/shared/types/ExternallyOwnedAccount';
import { isReadonlyAccount } from 'src/shared/types/validators';
import type { HTMLDialogElementInterface } from 'src/ui/ui-kit/ModalDialogs/HTMLDialogElementInterface';
import { WalletDisplayName } from 'src/ui/components/WalletDisplayName';
import { WalletAvatar } from 'src/ui/components/WalletAvatar';
import { UnstyledLink } from 'src/ui/ui-kit/UnstyledLink';
import { Button } from 'src/ui/ui-kit/Button';
import { CenteredDialog } from 'src/ui/ui-kit/ModalDialogs/CenteredDialog';
import { TextAnchor } from 'src/ui/ui-kit/TextAnchor';
import * as styles from 'src/ui/style/helpers.module.css';
import { AssetHeader } from './AssetHeader';

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
  );
}

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

function AssetStats({
  assetFullInfo,
  walletAssetDetails,
}: {
  assetFullInfo: AssetFullInfo;
  walletAssetDetails: WalletAssetDetails;
}) {
  const { currency } = useCurrency();
  const [showNetworkDistribution, setShowNetworkDistribution] = useState(false);

  const return24h =
    assetFullInfo.fungible.meta.relativeChange1d *
    assetFullInfo.fungible.meta.price;
  const relativeReturn24h = assetFullInfo.fungible.meta.relativeChange1d;

  return (
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

  return (
    <VStack gap={16}>
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
    </VStack>
  );
}

/**
 * Took this component from Web App
 * https://github.com/zeriontech/pulse-frontend/blob/master/src/z/dumb/TextPreview/index.tsx
 */
const TextPreview = ({ text }: { text: string }) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const [isClamped, setIsClamped] = useState<false | true | undefined>(
    undefined
  );
  // on Safari line-camp works correctly only with inline elements inside
  const paragraphs = text.split(/(\r?\n|\r)+/g);
  const markup: React.ReactNode[] = [];
  paragraphs.forEach((block, index, array) => {
    markup.push(<span key={index}>{block}</span>);
    markup.push(<br key={array.length + index} />);
  });

  useEffect(() => {
    if (ref.current) {
      if (ref.current.scrollHeight > ref.current.clientHeight) {
        setIsClamped(true);
      }
    }
  }, []);

  return (
    <div>
      <UIText
        as="p"
        kind="body/regular"
        style={
          isClamped ?? true
            ? {
                display: '-webkit-box',
                WebkitLineClamp: 4,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                wordBreak: 'break-word',
              }
            : { wordBreak: 'break-word' }
        }
        ref={ref}
      >
        {markup}
      </UIText>
      {isClamped && (
        <UnstyledButton
          onClick={() => setIsClamped(false)}
          style={{ color: 'var(--primary)' }}
          className={styles.hoverUnderline}
        >
          <UIText style={{ cursor: 'pointer' }} kind="body/regular">
            See more
          </UIText>
        </UnstyledButton>
      )}
    </div>
  );
};

function AssetDescription({ assetFullInfo }: { assetFullInfo: AssetFullInfo }) {
  return (
    <VStack gap={12}>
      <UIText kind="headline/h3">About {assetFullInfo.fungible.name}</UIText>
      <VStack gap={8}>
        <TextPreview text={assetFullInfo.extra.description} />
        <div style={{ display: 'flex', flexWrap: 'wrap' }}>
          {assetFullInfo.extra.relevantResources.map((resource) => (
            <TextAnchor
              key={resource.name}
              href={resource.url}
              target="_blank"
              rel="noreferrer noopenner"
              style={{ marginRight: 16, color: 'var(--primary)' }}
            >
              <HStack gap={4} alignItems="center">
                <UIText kind="body/regular" color="var(--primary)">
                  {resource.displayableName}
                </UIText>
                <LinkIcon style={{ width: 16, height: 16 }} />
              </HStack>
            </TextAnchor>
          ))}
        </div>
      </VStack>
    </VStack>
  );
}

function AssetAddressDetailsDialog({
  address,
  assetFullInfo,
  walletAssetDetails,
}: {
  address: string;
  assetFullInfo: AssetFullInfo;
  walletAssetDetails: WalletAssetDetails;
}) {
  return (
    <VStack
      gap={14}
      style={{
        padding: '8px 16px 16px',
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
          walletAssetDetails={walletAssetDetails}
        />
        <Line />
        <AssetAppDistribution
          assetFullInfo={assetFullInfo}
          walletAssetDetails={walletAssetDetails}
        />
        <Line />
        <AssetDescription assetFullInfo={assetFullInfo} />
      </VStack>
    </VStack>
  );
}

export function AssetAddressStats({
  address,
  assetFullInfo,
  wallet,
  walletAssetDetails,
}: {
  address: string;
  assetFullInfo: AssetFullInfo;
  wallet: ExternallyOwnedAccount;
  walletAssetDetails: WalletAssetDetails;
}) {
  const dialogRef = useRef<HTMLDialogElementInterface | null>(null);
  const { currency } = useCurrency();
  const asset = assetFullInfo.fungible;

  const isWatchedAddress = isReadonlyAccount(wallet);

  const unrealizedGainRaw = walletAssetDetails.pnl?.unrealizedPnl || 0;
  const unrealizedGainFormatted = `${getSign(
    unrealizedGainRaw
  )}${formatCurrencyValue(
    Math.abs(unrealizedGainRaw),
    'en',
    currency
  )} (${formatPercent(
    Math.abs(unrealizedGainRaw / walletAssetDetails.totalValue),
    'en'
  )}%)`;

  return (
    <>
      <VStack
        gap={0}
        style={{
          position: 'relative',
          border: '2px solid var(--neutral-200)',
          borderRadius: 14,
        }}
      >
        {isWatchedAddress ? (
          <HStack
            gap={8}
            alignItems="center"
            justifyContent="center"
            style={{
              backgroundColor: 'var(--neutral-200)',
              borderRadius: '16px 16px 0 0',
              padding: '4px 8px 6px',
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
        <VStack gap={12} style={{ padding: 16 }}>
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
          {walletAssetDetails.totalValue === 0 ? (
            <>
              {walletAssetDetails.pnl?.bought === 0 ? null : (
                <UIText kind="headline/h2" color="var(--neutral-500)">
                  {formatCurrencyValue(0, 'en', currency)}
                </UIText>
              )}
              <UIText kind="small/regular" color="var(--neutral-500)">
                {formatTokenValue(0, asset.symbol)}
              </UIText>
            </>
          ) : (
            <VStack gap={12}>
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
                    asset.symbol
                  )}
                </UIText>
              </VStack>
              <HStack gap={12} style={{ gridTemplateColumns: '1fr 1fr' }}>
                <VStack gap={4}>
                  <UIText kind="caption/regular" color="var(--neutral-500)">
                    Unrealised PnL
                  </UIText>
                  <UIText
                    kind="body/accent"
                    color={getColor(unrealizedGainRaw)}
                  >
                    {unrealizedGainFormatted}
                  </UIText>
                </VStack>
                <VStack gap={4}>
                  <UIText kind="caption/regular" color="var(--neutral-500)">
                    Invested
                  </UIText>
                  <UIText kind="body/accent">
                    {formatCurrencyValue(
                      walletAssetDetails.pnl?.bought || 0,
                      'en',
                      currency
                    )}
                  </UIText>
                </VStack>
              </HStack>
              <Button
                kind="neutral"
                size={48}
                onClick={() => dialogRef.current?.showModal()}
                style={{
                  ['--button-background' as string]: 'var(--neutral-200)',
                  ['--button-background-hover' as string]: 'var(--neutral-300)',
                }}
              >
                <UIText kind="body/accent"> More Details</UIText>
              </Button>
            </VStack>
          )}
        </VStack>
      </VStack>
      <CenteredDialog
        ref={dialogRef}
        containerStyle={{ backgroundColor: 'var(--white)', padding: 0 }}
        renderWhenOpen={() => (
          <>
            <div
              style={{
                position: 'sticky',
                top: 0,
                zIndex: 1,
                padding: 16,
                backdropFilter: 'blur(8px)',
              }}
            >
              <Button
                kind="ghost"
                value="cancel"
                size={40}
                style={{
                  width: 40,
                  padding: 8,
                  position: 'absolute',
                  top: 8,
                  left: 0,
                  zIndex: 2,
                }}
                onClick={() => dialogRef.current?.close()}
              >
                <ArrowLeftIcon />
              </Button>
              <AssetHeader asset={asset} />
            </div>
            <AssetAddressDetailsDialog
              address={wallet.address}
              assetFullInfo={assetFullInfo}
              walletAssetDetails={walletAssetDetails}
            />
          </>
        )}
      />
    </>
  );
}
