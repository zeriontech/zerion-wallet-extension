import React from 'react';
import { formatCurrencyValue } from 'src/shared/units/formatCurrencyValue';
import { formatPercent } from 'src/shared/units/formatPercent';
import { BlurrableBalance } from 'src/ui/components/BlurrableBalance';
import { HStack } from 'src/ui/ui-kit/HStack';
import { UIText } from 'src/ui/ui-kit/UIText';
import { UnstyledAnchor } from 'src/ui/ui-kit/UnstyledAnchor';
import HyperliquidLogo from 'jsx:src/ui/assets/hyperliquid-logo.svg';
import ArrowLeftTop from 'jsx:src/ui/assets/arrow-left-top.svg';

const HYPERLIQUID_URL = 'https://app.hyperliquid.xyz/join/ZERS';

export function PerpsBalanceBanner({
  balance,
  percentage,
  currency,
}: {
  balance: number;
  percentage: number;
  currency: string;
}) {
  return (
    <UnstyledAnchor
      href={HYPERLIQUID_URL}
      target="_blank"
      rel="noopener noreferrer"
    >
      <HStack
        gap={8}
        alignItems="center"
        style={{
          gridTemplateColumns: 'auto auto 1fr',
          padding: '12px 16px 12px 12px',
          background: 'var(--neutral-100)',
          borderRadius: 8,
        }}
      >
        <HyperliquidLogo style={{ width: 24, height: 24, flexShrink: 0 }} />
        <HStack
          gap={4}
          alignItems="center"
          style={{ gridTemplateColumns: '1fr auto' }}
        >
          <UIText
            kind="body/accent"
            style={{
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            Perps Balance
          </UIText>
          <div
            style={{
              background: 'var(--neutral-200)',
              borderRadius: 8,
              padding: '4px 6px',
            }}
          >
            <UIText kind="caption/accent">
              {formatPercent(percentage, 'en')}%
            </UIText>
          </div>
        </HStack>
        <HStack gap={8} alignItems="center" justifyContent="end">
          <BlurrableBalance kind="body/regular" color="var(--black)">
            <UIText kind="body/regular">
              {formatCurrencyValue(balance, 'en', currency, {
                notation: balance > 1e8 ? 'compact' : 'standard',
                minimumFractionDigits: 2,
              })}
            </UIText>
          </BlurrableBalance>
          <ArrowLeftTop
            style={{ color: 'var(--neutral-600)', width: 12, height: 12 }}
          />
        </HStack>
      </HStack>
    </UnstyledAnchor>
  );
}
