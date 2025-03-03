import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useCurrency } from 'src/modules/currency/useCurrency';
import { invariant } from 'src/shared/invariant';
import { NavigationTitle } from 'src/ui/components/NavigationTitle';
import { PageColumn } from 'src/ui/components/PageColumn';
import { StickyBottomPanel } from 'src/ui/ui-kit/BottomPanel';
import { Button } from 'src/ui/ui-kit/Button';
import { HStack } from 'src/ui/ui-kit/HStack';
import { VStack } from 'src/ui/ui-kit/VStack';
import SwapIcon from 'jsx:src/ui/assets/actions/swap.svg';
import SendIcon from 'jsx:src/ui/assets/actions/send.svg';
import BridgeIcon from 'jsx:src/ui/assets/actions/bridge.svg';
import VerifiedIcon from 'jsx:src/ui/assets/verified.svg';
import { UIText } from 'src/ui/ui-kit/UIText';
import { PageTop } from 'src/ui/components/PageTop';
import { TokenIcon } from 'src/ui/ui-kit/TokenIcon';
import { formatPercent } from 'src/shared/units/formatPercent/formatPercent';
import { formatCurrencyValue } from 'src/shared/units/formatCurrencyValue';
import { emDash } from 'src/ui/shared/typography';
import { useAssetFullInfo } from 'src/modules/zerion-api/hooks/useAssetFullInfo';
import type {
  Asset,
  AssetFullInfo,
} from 'src/modules/zerion-api/requests/asset-get-fungible-full-info';
import { UnstyledAnchor } from 'src/ui/ui-kit/UnstyledAnchor';
import { useNetworks } from 'src/modules/networks/useNetworks';
import DownIcon from 'jsx:src/ui/assets/chevron-down.svg';
import CopyIcon from 'jsx:src/ui/assets/copy.svg';
import CheckIcon from 'jsx:src/ui/assets/check_double.svg';
import { useCopyToClipboard } from 'src/ui/shared/useCopyToClipboard';
import type { NetworkConfig } from 'src/modules/networks/NetworkConfig';
import { middleTruncate } from 'src/ui/shared/middleTruncate';
import { createChain } from 'src/modules/networks/Chain';
import { isTruthy } from 'is-truthy-ts';
import * as styles from './styles.module.css';

const SCROLL_THRESHOLD = 80;

function AssetPageHeader({ asset }: { asset: Asset }) {
  const [showTokenInfoInHeader, setShowTokenInfoInHeader] = useState(false);
  const { currency } = useCurrency();

  useEffect(() => {
    const handleScroll = () =>
      setShowTokenInfoInHeader(window.scrollY < SCROLL_THRESHOLD);

    handleScroll();
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return showTokenInfoInHeader ? null : (
    <HStack
      gap={8}
      alignItems="center"
      justifyContent="center"
      className={styles.assetHeaderContent}
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

function AssetTitleAndChart({ asset }: { asset: Asset }) {
  const { currency } = useCurrency();
  return (
    <VStack gap={12}>
      <HStack gap={8} alignItems="center">
        <div style={{ position: 'relative' }}>
          <TokenIcon
            src={asset.iconUrl}
            symbol={asset.symbol}
            size={40}
            title={asset.name}
          />
          {asset.new ? (
            <UIText
              kind="caption/accent"
              color="var(--white)"
              style={{
                position: 'absolute',
                top: 32,
                left: 4,
                background: 'var(--black)',
                borderRadius: 6,
                padding: '2px 4px',
              }}
            >
              new
            </UIText>
          ) : null}
        </div>
        <VStack gap={0}>
          <UIText kind="caption/regular" color="var(--neutral-500)">
            {asset.symbol}
          </UIText>
          <HStack gap={4} alignItems="center">
            <UIText kind="headline/h3" style={{ display: 'flex' }}>
              {asset.name}
            </UIText>
            {asset.verified ? <VerifiedIcon /> : null}
          </HStack>
        </VStack>
      </HStack>
      <HStack gap={8} alignItems="end">
        <UIText kind="headline/hero">
          {formatCurrencyValue(asset.meta.price || 0, 'en', currency)}
        </UIText>
        <UIText
          kind="body/accent"
          color={
            asset.meta.relativeChange1d > 0
              ? 'var(--positive-500)'
              : asset.meta.relativeChange1d < 0
              ? 'var(--negative-500)'
              : 'var(--neutral-500)'
          }
          style={{ paddingBottom: 4 }}
        >
          {formatPercent(asset.meta.relativeChange1d, 'en')}%
        </UIText>
      </HStack>
    </VStack>
  );
}

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

const ONE_DAY = 24 * 60 * 60 * 1000;
const ONE_HOUR = 60 * 60 * 1000;

function AssetCommonStats({ assetFullInfo }: { assetFullInfo: AssetFullInfo }) {
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
      <AssetStatsChip
        title="FDV"
        fullTitle="Fully Diluted Valuation"
        value={formatCurrencyValue(
          assetFullInfo.fungible.meta.fullyDilutedValuation,
          'en',
          currency,
          {
            notation: 'compact',
            maximumFractionDigits: 1,
          }
        )}
      />
      <AssetStatsChip
        title="MCAP"
        fullTitle="Market Capitalization"
        value={formatCurrencyValue(
          assetFullInfo.fungible.meta.marketCap,
          'en',
          currency,
          {
            notation: 'compact',
            maximumFractionDigits: 1,
          }
        )}
      />
      {assetFullInfo.extra.volume24h ? (
        <AssetStatsChip
          title="VOL"
          fullTitle="Volume 24h"
          value={formatCurrencyValue(
            assetFullInfo.extra.volume24h,
            'en',
            currency,
            {
              notation: 'compact',
              maximumFractionDigits: 1,
            }
          )}
        />
      ) : null}
      {assetFullInfo.extra.holders ? (
        <AssetStatsChip
          title="HLDRS"
          fullTitle="Holders"
          value={assetFullInfo.extra.holders}
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
            {
              notation: 'compact',
              maximumFractionDigits: 1,
            }
          )}
        />
      ) : null}
    </HStack>
  );
}

// function AssetAddressStats({ asset }: { asset: Asset }) {
//   return null;
// }

function AssetImplementationButton({
  network,
  address,
}: {
  network: NetworkConfig;
  address: string | null;
}) {
  const { handleCopy, isSuccess } = useCopyToClipboard({
    text: address || 'null',
  });
  return (
    <Button
      onClick={handleCopy}
      aria-label="Copy token address"
      size={36}
      kind="neutral"
      style={{
        ['--button-background' as string]: 'var(--neutral-200)',
        ['--button-background-hover' as string]: 'var(--neutral-300)',
      }}
    >
      <HStack gap={4} alignItems="center">
        <HStack gap={6} alignItems="center">
          <img
            src={network.icon_url}
            alt={network.name}
            width={24}
            height={24}
          />
          <UIText kind="small/accent">
            {address ? middleTruncate({ value: address }) : 'Native'}
          </UIText>
        </HStack>
        {isSuccess ? (
          <CheckIcon style={{ color: 'var(--positive-500)' }} />
        ) : (
          <CopyIcon style={{ color: 'var(--neutral-500)' }} />
        )}
      </HStack>
    </Button>
  );
}

function AssetResources({ assetFullInfo }: { assetFullInfo: AssetFullInfo }) {
  const { networks } = useNetworks();
  const implementations = useMemo(
    () =>
      Object.entries(assetFullInfo.fungible.implementations)
        .map(([networkId, config]) => {
          const network = networks?.getNetworkByName(createChain(networkId));
          return network ? { address: config.address, network } : null;
        })
        .filter(isTruthy),
    [assetFullInfo.fungible.implementations, networks]
  );

  return (
    <HStack gap={24} justifyContent="space-between">
      <HStack gap={8}>
        {assetFullInfo.extra.relevantResources.map((resource) => (
          <Button
            key={resource.name}
            as={UnstyledAnchor}
            rel="noopenner noreferrer"
            target="_blank"
            kind="neutral"
            size={36}
            href={resource.url}
            style={{ padding: 6, border: '2px solid var(--neutral-200)' }}
            aria-label={resource.displayableName}
          >
            <img src={resource.iconUrl} width={20} height={20} />
          </Button>
        ))}
      </HStack>
      <HStack gap={4}>
        {implementations.length ? (
          <AssetImplementationButton
            address={implementations[0].address}
            network={implementations[0].network}
          />
        ) : null}
        {implementations.length > 1 ? (
          <Button
            kind="regular"
            size={36}
            style={{
              padding: 8,
              ['--button-background' as string]: 'var(--neutral-200)',
              ['--button-background-hover' as string]: 'var(--neutral-300)',
            }}
          >
            <DownIcon style={{ width: 20, height: 20 }} />
          </Button>
        ) : null}
      </HStack>
    </HStack>
  );
}

export function AssetPage() {
  const { asset_code } = useParams();
  invariant(asset_code, 'Asset Code is required');

  const { currency } = useCurrency();
  const { data } = useAssetFullInfo({ currency, fungibleId: asset_code });

  const showSendButton = true;

  if (!data?.data.fungible) {
    return null;
  }
  const asset = data.data.fungible;

  return (
    <PageColumn>
      <NavigationTitle
        title={<AssetPageHeader asset={asset} />}
        documentTitle={`${asset.name} - info`}
      />
      <PageTop />
      <VStack gap={24} style={{ flexGrow: 1, alignContent: 'start' }}>
        <AssetTitleAndChart asset={asset} />
        <AssetCommonStats assetFullInfo={data.data} />
        <AssetResources assetFullInfo={data.data} />
      </VStack>
      <StickyBottomPanel
        style={{ padding: 0, background: 'none', boxShadow: 'none' }}
      >
        <HStack
          gap={8}
          style={{
            width: '100%',
            gridTemplateColumns: showSendButton ? '1fr auto auto' : '1fr',
          }}
        >
          <Button kind="primary" size={48}>
            <HStack gap={8} alignItems="center" justifyContent="center">
              <SwapIcon style={{ width: 20, height: 20 }} />
              <UIText kind="body/accent">Swap</UIText>
            </HStack>
          </Button>
          <Button
            kind="primary"
            size={48}
            style={{ padding: 14 }}
            aria-label="Send Token"
          >
            <SendIcon style={{ width: 20, height: 20 }} />
          </Button>
          <Button
            kind="primary"
            size={48}
            style={{ padding: 14 }}
            aria-label="Bridge Token"
          >
            <BridgeIcon style={{ width: 20, height: 20 }} />
          </Button>
        </HStack>
      </StickyBottomPanel>
    </PageColumn>
  );
}
