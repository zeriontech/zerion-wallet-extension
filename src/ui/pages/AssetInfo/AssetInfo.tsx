import { type Asset, useAssetsFullInfo } from 'defi-sdk';
import React, { useEffect, useState } from 'react';
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
import * as styles from './styles.module.css';

const SCROLL_THRESHOLD = 80;

function AssetPageHeader({ asset }: { asset: Asset }) {
  const [showTokenInfoInHeader, setShowTokenInfoInHeader] = useState(false);
  const { currency } = useCurrency();

  useEffect(() => {
    const handleScroll = () =>
      setShowTokenInfoInHeader(window.scrollY > SCROLL_THRESHOLD);

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
        src={asset.icon_url}
        symbol={asset.symbol}
        size={20}
        title={asset.name}
      />
      <UIText kind="body/accent">
        {asset.symbol} {emDash}{' '}
        {formatCurrencyValue(asset.price?.value || 0, 'en', currency)}
      </UIText>
    </HStack>
  );
}
export function AssetPage() {
  const { asset_code } = useParams();
  const { currency } = useCurrency();
  invariant(asset_code, 'Asset Code is required');
  const { value } = useAssetsFullInfo({ asset_code, currency });

  const showSendButton = true;

  if (!value) {
    return null;
  }

  const priceChange = value.asset.price?.relative_change_24h || 0;

  return (
    <PageColumn>
      <NavigationTitle
        title={<AssetPageHeader asset={value.asset} />}
        documentTitle={`${value.asset.name} - info`}
      />
      <PageTop />
      <VStack gap={24} style={{ flexGrow: 1 }}>
        <VStack gap={16}>
          <VStack gap={12}>
            <HStack gap={8} alignItems="center">
              <TokenIcon
                src={value.asset.icon_url}
                symbol={value.asset.symbol}
                size={40}
                title={value.asset.name}
              />
              <VStack gap={0}>
                <UIText kind="caption/regular" color="var(--neutral-500)">
                  {value.asset.symbol}
                </UIText>
                <HStack gap={4} alignItems="center">
                  <UIText kind="headline/h3" style={{ display: 'flex' }}>
                    {value.asset.name}
                  </UIText>
                  {value.asset.is_verified ? <VerifiedIcon /> : null}
                </HStack>
              </VStack>
            </HStack>
            <HStack gap={8} alignItems="end">
              <UIText kind="headline/hero">
                {formatCurrencyValue(
                  value.asset.price?.value || 0,
                  'en',
                  currency
                )}
              </UIText>
              <UIText
                kind="body/accent"
                color={
                  priceChange > 0
                    ? 'var(--positive-500)'
                    : priceChange < 0
                    ? 'var(--negative-500)'
                    : 'var(--neutral-500)'
                }
                style={{ paddingBottom: 4 }}
              >
                {formatPercent(priceChange, 'en')}%
              </UIText>
            </HStack>
          </VStack>
        </VStack>
        <div style={{ height: 15000 }} />
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
