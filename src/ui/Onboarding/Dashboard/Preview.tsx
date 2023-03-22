import { useAddressPortfolio, useAddressPositions } from 'defi-sdk';
import React, { useEffect, useRef, useState } from 'react';
import { formatCurrencyToParts } from 'src/shared/units/formatCurrencyValue';
import { WalletAvatar } from 'src/ui/components/WalletAvatar';
import { WalletDisplayName } from 'src/ui/components/WalletDisplayName';
import { Skeleton } from 'src/ui/pages/Feed/Loader';
import { useAddressNfts } from 'src/ui/shared/requests/addressNfts/useAddressNfts';
import { NBSP } from 'src/ui/shared/typography';
import { HStack } from 'src/ui/ui-kit/HStack';
import { NeutralDecimals } from 'src/ui/ui-kit/NeutralDecimals';
import { UIText } from 'src/ui/ui-kit/UIText';
import { UnstyledAnchor } from 'src/ui/ui-kit/UnstyledAnchor';
import { VStack } from 'src/ui/ui-kit/VStack';
import MedalIcon from 'jsx:./medal.svg';
import * as styles from './styles.module.css';

function getRandomArbitrary(min: number, max: number) {
  return Math.floor(Math.random() * (max - min)) + min;
}

const ICON_NUMBER = 9;
const POPULAR_TOKENS_URLS = [
  'https://token-icons.s3.amazonaws.com/eth.png',
  'https://token-icons.s3.amazonaws.com/0xdac17f958d2ee523a2206206994597c13d831ec7.png',
  'https://token-icons.s3.amazonaws.com/0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48.png',
  'https://token-icons.s3.amazonaws.com/0x7d1afa7b718fb893db30a3abc0cfc608aacfebb0.png',
  'https://token-icons.s3.amazonaws.com/43e05303-bf43-48df-be45-352d7567ff39.png',
  'https://token-icons.s3.amazonaws.com/0x4200000000000000000000000000000000000042.png',
  'https://token-icons.s3.amazonaws.com/0xb8c77482e45f1f44de1745f52c74426c631bdd52.png',
  'https://s3.amazonaws.com/token-icons/0x6b175474e89094c44da98b954eedeac495271d0f.png',
];

function getAssetCodeFromIconUrl(url: string) {
  return url.split('/').slice(-1)[0].slice(0, -4);
}
interface IconConfig {
  iconUrl: string;
  zerionUrl: string;
  type: 'token' | 'nft';
}

function useAssetsIcons(address: string) {
  const [result, setResult] = useState<IconConfig[] | null>(null);

  const { value: positions } = useAddressPositions(
    {
      address,
      currency: 'usd',
    },
    { cachePolicy: 'cache-first' }
  );

  const { value: nfts } = useAddressNfts(
    {
      address,
      currency: 'usd',
      sorted_by: 'floor_price_high',
    },
    { cachePolicy: 'cache-first', limit: ICON_NUMBER }
  );

  useEffect(() => {
    if (!positions || !nfts || result) {
      return;
    }
    const filteredNfts = nfts.filter((item) =>
      Boolean(item.metadata.content?.image_preview_url)
    );
    const filteredTokens = positions.positions.filter((item) =>
      Boolean(item.asset.icon_url)
    );
    const nftsNumber = Math.min(getRandomArbitrary(4, 6), filteredNfts.length);
    const tokensNumber = Math.min(
      ICON_NUMBER - nftsNumber,
      filteredTokens.length
    );
    const defaultIconsNumber = ICON_NUMBER - nftsNumber - tokensNumber;

    const resultArray: IconConfig[] = [
      ...filteredNfts.slice(0, nftsNumber).map((item) => ({
        iconUrl: item.metadata.content?.image_preview_url || '',
        type: 'nft' as const,
        zerionUrl: `https://app.zerion.io/nfts/${item.chain}/${item.contract_address}:${item.token_id}?address=${address}`,
      })),
      ...filteredTokens.slice(0, tokensNumber).map((item) => ({
        iconUrl: item.asset.icon_url || '',
        type: 'token' as const,
        zerionUrl: `https://app.zerion.io/tokens/${item.asset.asset_code}?address=${address}`,
      })),
      ...POPULAR_TOKENS_URLS.slice(0, defaultIconsNumber).map((item) => ({
        iconUrl: item,
        type: 'token' as const,
        zerionUrl: `https://app.zerion.io/tokens/${getAssetCodeFromIconUrl(
          item
        )}`,
      })),
    ];

    // shuffle array
    setResult(resultArray.sort((_, __) => 0.5 - Math.random()));
  }, [positions, nfts, result, address]);

  return result;
}

function Icon({ iconUrl, zerionUrl, type }: IconConfig) {
  const ref = useRef<HTMLImageElement | null>(null);

  return (
    <UnstyledAnchor
      className={styles.assetIcon}
      href={zerionUrl}
      target="_blank"
    >
      <img
        src={iconUrl}
        ref={ref}
        style={{
          borderRadius: type === 'nft' ? 12 : '50%',
          opacity: 0.01,
        }}
        onLoad={() => ref.current?.style.setProperty('opacity', '1')}
      />
    </UnstyledAnchor>
  );
}

export function Preview({
  address,
  isWhitelisted,
}: {
  address: string;
  isWhitelisted: boolean;
}) {
  const { value, isLoading: valueIsLoading } = useAddressPortfolio({
    address,
    currency: 'usd',
    portfolio_fields: 'all',
    use_portfolio_service: true,
  });

  const icons = useAssetsIcons(address);

  return (
    <div className={styles.preview}>
      {isWhitelisted ? (
        <div className={styles.accessBadge}>
          <HStack gap={8} alignItems="center">
            <MedalIcon />
            <UIText kind="small/accent" color="var(--always-white)">
              Exclusive early access
            </UIText>
          </HStack>
        </div>
      ) : null}
      <HStack gap={20} alignItems="center">
        <UnstyledAnchor
          className={styles.avatarWrapper}
          href={`https://app.zerion.io/${address}`}
          target="_blank"
        >
          <WalletAvatar size={72} address={address} borderRadius={12} />
        </UnstyledAnchor>
        <VStack gap={8}>
          <UIText kind="headline/h3">
            <WalletDisplayName wallet={{ address, name: null }} />
          </UIText>
          <UIText kind="headline/hero">
            {valueIsLoading ? (
              <Skeleton width={200} height={36} borderRadius={8} />
            ) : value?.total_value != null ? (
              <NeutralDecimals
                parts={formatCurrencyToParts(value.total_value, 'en', 'usd')}
              />
            ) : (
              NBSP
            )}
          </UIText>
        </VStack>
      </HStack>
      <div className={styles.iconGrid}>
        {icons
          ? icons.map((iconConfig, index) => (
              <Icon key={index} {...iconConfig} />
            ))
          : null}
      </div>
    </div>
  );
}
