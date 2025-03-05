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
import ArrowDownIcon from 'jsx:src/ui/assets/caret-down-filled.svg';
import FlagIcon from 'jsx:src/ui/assets/flag.svg';
import EyeIcon from 'jsx:src/ui/assets/eye.svg';
import { UIText } from 'src/ui/ui-kit/UIText';
import { PageTop } from 'src/ui/components/PageTop';
import { TokenIcon } from 'src/ui/ui-kit/TokenIcon';
import { formatPercent } from 'src/shared/units/formatPercent/formatPercent';
import {
  formatCurrencyToParts,
  formatCurrencyValue,
} from 'src/shared/units/formatCurrencyValue';
import { emDash, minus } from 'src/ui/shared/typography';
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
import { useQuery } from '@tanstack/react-query';
import { walletPort } from 'src/ui/shared/channels';
import { useAddressParams } from 'src/ui/shared/user-address/useAddressParams';
import { useWalletPnL } from 'src/modules/zerion-api/hooks/useWalletPnL';
import { isReadonlyAccount } from 'src/shared/types/validators';
import { UnstyledLink } from 'src/ui/ui-kit/UnstyledLink';
import { WalletAvatar } from 'src/ui/components/WalletAvatar';
import { WalletDisplayName } from 'src/ui/components/WalletDisplayName';
import { formatTokenValue } from 'src/shared/units/formatTokenValue';
import { NeutralDecimals } from 'src/ui/ui-kit/NeutralDecimals';
import { useWalletAssetDetails } from 'src/modules/zerion-api/hooks/useWalletAssetDetails';
import type { ExternallyOwnedAccount } from 'src/shared/types/ExternallyOwnedAccount';
import type { WalletAssetDetails } from 'src/modules/zerion-api/requests/wallet-get-asset-details';
import * as styles from './styles.module.css';
import { AssetHistory } from './AssetHistory';

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

function AssetAddressStats({
  asset,
  wallet,
  walletAssetDetails,
}: {
  asset: Asset;
  wallet: ExternallyOwnedAccount;
  walletAssetDetails: WalletAssetDetails;
}) {
  const { ready, singleAddressNormalized } = useAddressParams();
  const { currency } = useCurrency();

  const { data: walletPnL } = useWalletPnL(
    { addresses: [singleAddressNormalized], currency, fungibleIds: [asset.id] },
    { enabled: ready }
  );

  const isWatchedAddress = isReadonlyAccount(wallet);

  const fullValue = walletAssetDetails.wallets[0].value;
  const unrealizedGainRaw = walletPnL?.data.unrealizedGain || 0;
  const unrealizedGainFormatted = `${
    unrealizedGainRaw > 0 ? '+' : unrealizedGainRaw < 0 ? minus : ''
  }${formatCurrencyValue(
    Math.abs(unrealizedGainRaw),
    'en',
    currency
  )} (${formatPercent(Math.abs(unrealizedGainRaw / fullValue), 'en')}%)`;

  return (
    <VStack
      gap={0}
      style={{
        position: 'relative',
        border: '2px solid var(--neutral-200)',
        borderRadius: 16,
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
                address={singleAddressNormalized}
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
        {fullValue === 0 ? (
          <UIText kind="small/regular" color="var(--neutral-500)">
            {formatTokenValue(0, asset.symbol)}
          </UIText>
        ) : (
          <VStack gap={12}>
            <VStack gap={4}>
              <UIText kind="headline/h1">
                <NeutralDecimals
                  parts={formatCurrencyToParts(
                    walletAssetDetails.wallets[0].value,
                    'en',
                    currency
                  )}
                />
              </UIText>
              <UIText kind="small/regular" color="var(--neutral-500)">
                {formatTokenValue(
                  walletAssetDetails.wallets[0].convertedQuantity,
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
                  color={
                    unrealizedGainRaw > 0
                      ? 'var(--positive-500)'
                      : unrealizedGainRaw < 0
                      ? 'var(--negative-500)'
                      : 'var(--neutral-500)'
                  }
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
                    walletPnL?.data.netInvested || 0,
                    'en',
                    currency
                  )}
                </UIText>
              </VStack>
            </HStack>
            <Button
              as={UnstyledLink}
              to="/wallets"
              kind="neutral"
              size={48}
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
  );
}

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
          <CheckIcon
            style={{ color: 'var(--positive-500)', width: 20, height: 20 }}
          />
        ) : (
          <CopyIcon
            style={{ color: 'var(--neutral-500)', width: 20, height: 20 }}
          />
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

function ReportAssetLink({ asset }: { asset: Asset }) {
  return (
    <UnstyledAnchor
      target="_blank"
      href={`https://zerion-io.typeform.com/to/IVsRHfBy?typeform-medium=embed-snippet#symbol=${asset.symbol}&asset_id=${asset.id}`}
      rel="noopener noreferrer"
      className="parent-hover"
      style={{
        ['--parent-content-color' as string]: 'var(--neutral-400)',
        ['--parent-hovered-content-color' as string]: 'var(--neutral-700)',
      }}
    >
      <HStack
        gap={8}
        alignItems="center"
        className="content-hover"
        justifyContent="center"
      >
        <FlagIcon style={{ width: 20, height: 20 }} />
        <UIText kind="small/accent">Report Asset</UIText>
      </HStack>
    </UnstyledAnchor>
  );
}

export function AssetPage() {
  const { asset_code } = useParams();
  invariant(asset_code, 'Asset Code is required');

  const { currency } = useCurrency();
  const { data } = useAssetFullInfo({ currency, fungibleId: asset_code });
  const { ready, singleAddress, singleAddressNormalized } = useAddressParams();
  const { data: walletData } = useWalletAssetDetails(
    {
      assetId: asset_code,
      currency,
      groupBy: ['by-wallet', 'by-app'],
      addresses: [singleAddressNormalized],
    },
    { enabled: ready }
  );

  const { data: wallet } = useQuery({
    queryKey: ['wallet/uiGetWalletByAddress', singleAddress, null],
    queryFn: () =>
      walletPort.request('uiGetWalletByAddress', {
        address: singleAddress,
        groupId: null,
      }),
    suspense: false,
    enabled: ready,
  });

  if (!data?.data.fungible || !wallet || !walletData) {
    return null;
  }

  const asset = data.data.fungible;
  const isWatchedAddress = isReadonlyAccount(wallet);
  const isEmptyBalance = walletData?.data.wallets[0].value === 0;

  return (
    <PageColumn>
      <NavigationTitle
        title={<AssetPageHeader asset={asset} />}
        documentTitle={`${asset.name} - info`}
      />
      <PageTop />
      <VStack
        gap={24}
        style={{ flexGrow: 1, alignContent: 'start', paddingBottom: 72 }}
      >
        <AssetTitleAndChart asset={asset} />
        <AssetCommonStats assetFullInfo={data.data} />
        <AssetAddressStats
          wallet={wallet}
          asset={asset}
          walletAssetDetails={walletData.data}
        />
        <AssetResources assetFullInfo={data.data} />
        <AssetHistory
          assetId={asset_code}
          asset={asset}
          address={singleAddressNormalized}
        />
        <ReportAssetLink asset={asset} />
      </VStack>
      {isWatchedAddress ? null : (
        <StickyBottomPanel
          style={{ padding: 0, background: 'none', boxShadow: 'none' }}
          backdropStyle={{ inset: '-16px -16px 0' }}
        >
          <HStack
            gap={8}
            style={{
              width: '100%',
              gridTemplateColumns: isEmptyBalance ? '1fr' : '1fr auto auto',
            }}
          >
            <Button kind="primary" size={48}>
              <HStack gap={8} alignItems="center" justifyContent="center">
                <SwapIcon style={{ width: 20, height: 20 }} />
                <UIText kind="body/accent">Swap</UIText>
              </HStack>
            </Button>
            {isEmptyBalance ? null : (
              <>
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
              </>
            )}
          </HStack>
        </StickyBottomPanel>
      )}
    </PageColumn>
  );
}
