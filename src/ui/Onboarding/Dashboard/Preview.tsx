import { useAddressPortfolio, useAddressPositions } from 'defi-sdk';
import React, { useMemo } from 'react';
import { formatCurrencyToParts } from 'src/shared/units/formatCurrencyValue';
import { WalletAvatar } from 'src/ui/components/WalletAvatar';
import { WalletDisplayName } from 'src/ui/components/WalletDisplayName';
import { Skeleton } from 'src/ui/pages/Feed/Loader';
import { useAddressNfts } from 'src/ui/shared/requests/addressNfts/useAddressNfts';
import { NBSP } from 'src/ui/shared/typography';
import { HStack } from 'src/ui/ui-kit/HStack';
import { NeutralDecimals } from 'src/ui/ui-kit/NeutralDecimals';
import { UIText } from 'src/ui/ui-kit/UIText';
import { VStack } from 'src/ui/ui-kit/VStack';
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

interface IconConfig {
  iconUrl: string;
  type: 'token' | 'nft';
}

function useAssetsIcons(address: string) {
  const { value: positions } = useAddressPositions({
    address,
    currency: 'usd',
  });

  const { value: nfts } = useAddressNfts({
    address,
    currency: 'usd',
    limit: 9,
    sorted_by: 'floor_price_high',
  });

  return useMemo<IconConfig[] | null>(() => {
    if (!positions || !nfts) {
      return null;
    }
    const nftIconUrls = nfts
      .map((item) => item.metadata.content?.image_preview_url)
      .filter(Boolean) as string[];
    const tokenIconUrls = positions.positions
      .map((item) => item.asset.icon_url)
      .filter(Boolean) as string[];
    const nftsNumber = Math.min(getRandomArbitrary(4, 6), tokenIconUrls.length);
    const tokensNumber = Math.min(
      ICON_NUMBER - nftsNumber,
      tokenIconUrls.length
    );
    const defaultIconsNumber = ICON_NUMBER - nftsNumber - tokensNumber;

    console.log(nftsNumber, tokensNumber, defaultIconsNumber);

    const resultArray: IconConfig[] = [
      ...nftIconUrls
        .slice(0, nftsNumber)
        .map((item) => ({ iconUrl: item, type: 'nft' as const })),
      ...tokenIconUrls
        .slice(0, tokensNumber)
        .map((item) => ({ iconUrl: item, type: 'token' as const })),
      ...POPULAR_TOKENS_URLS.slice(0, defaultIconsNumber).map((item) => ({
        iconUrl: item,
        type: 'token' as const,
      })),
    ];

    // shuffle array
    return resultArray.sort((_, __) => 0.5 - Math.random());
  }, [positions, nfts]);
}

export function Preview({ address }: { address: string }) {
  const { value } = useAddressPortfolio({
    address,
    currency: 'usd',
    portfolio_fields: 'all',
    use_portfolio_service: true,
  });

  const icons = useAssetsIcons(address);

  console.log(icons);

  return (
    <div className={styles.preview}>
      <HStack gap={20} alignItems="center">
        <WalletAvatar size={72} address={address} borderRadius={12} />
        <VStack gap={8}>
          <UIText kind="headline/h3">
            <WalletDisplayName wallet={{ address, name: null }} />
          </UIText>
          <UIText kind="headline/hero">
            {value?.total_value != null ? (
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
          ? icons.map(({ iconUrl, type }, index) => (
              <div className={styles.assetIcon}>
                <img
                  key={index}
                  src={iconUrl}
                  style={{ borderRadius: type === 'nft' ? 12 : '50%' }}
                />
              </div>
            ))
          : [...Array(9).keys()].map((index) => (
              <Skeleton key={index} width={72} height={72} borderRadius={12} />
            ))}
      </div>
    </div>
  );
}
