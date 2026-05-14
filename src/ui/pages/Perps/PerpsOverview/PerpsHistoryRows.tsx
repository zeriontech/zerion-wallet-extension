import React from 'react';
import { useCurrency } from 'src/modules/currency/useCurrency';
import { formatCurrencyValue } from 'src/shared/units/formatCurrencyValue';
import { formatPriceValue } from 'src/shared/units/formatPriceValue';
import { getPerpDisplayName } from 'src/modules/hyperliquid/parsePerpId';
import { getPerpIconUrl } from 'src/modules/hyperliquid/getPerpIconUrl';
import type { PerpFill } from 'src/modules/hyperliquid/api/requests/perp-user-fills.types';
import type {
  NonFundingLedgerUpdate,
  NonFundingLedgerUpdateType,
} from 'src/modules/hyperliquid/api/requests/perp-non-funding-ledger.types';
import ArrowDownIcon from 'jsx:src/ui/assets/arrow-down.svg';
import { HStack } from 'src/ui/ui-kit/HStack';
import { TokenIcon } from 'src/ui/ui-kit/TokenIcon';
import { UIText } from 'src/ui/ui-kit/UIText';
import { UnstyledLink } from 'src/ui/ui-kit/UnstyledLink';
import { VStack } from 'src/ui/ui-kit/VStack';

function getDirectionLabel(fill: PerpFill): string {
  const lowered = fill.dir.toLowerCase();
  const isLong = lowered.includes('long');
  const isShort = lowered.includes('short');
  if (lowered.startsWith('open') && isLong) return 'Open Long';
  if (lowered.startsWith('open') && isShort) return 'Open Short';
  if (lowered.startsWith('close') && isLong) return 'Close Long';
  if (lowered.startsWith('close') && isShort) return 'Close Short';
  if (isLong) return 'Long';
  if (isShort) return 'Short';
  return fill.dir;
}

export function PerpsHistoryTradeRow({
  fill,
  leverage,
}: {
  fill: PerpFill;
  leverage: number | null;
}) {
  const { currency } = useCurrency();
  const displayName = getPerpDisplayName(fill.coin);
  const px = Number(fill.px);
  const closedPnl = Number(fill.closedPnl);
  const fee = Number(fill.fee);
  const netPnl = closedPnl - fee;

  const baseLabel = getDirectionLabel(fill);
  const label = fill.liquidation ? `${baseLabel} Liquidation` : baseLabel;

  const hasPnl = closedPnl !== 0;
  const isPositive = netPnl >= 0;
  const trailing = hasPnl
    ? `${isPositive ? '+' : ''}${formatCurrencyValue(netPnl, 'en', currency)}`
    : formatCurrencyValue(Number(fill.sz) * px, 'en', currency);
  const trailingColor = hasPnl
    ? isPositive
      ? 'var(--positive-500)'
      : 'var(--negative-500)'
    : undefined;

  return (
    <UnstyledLink
      to={`/perps/${encodeURIComponent(fill.coin)}`}
      style={{ display: 'block' }}
      className="hover:bg-neutral-100"
    >
      <HStack
        gap={12}
        alignItems="center"
        style={{
          paddingLeft: 16,
          width: '100%',
          gridTemplateColumns: 'auto 1fr',
        }}
      >
        <TokenIcon
          src={getPerpIconUrl(fill.coin)}
          symbol={displayName}
          size={36}
          style={{ borderRadius: '50%', flexShrink: 0 }}
        />
        <HStack
          gap={12}
          alignItems="center"
          style={{
            minWidth: 0,
            padding: '12px 16px 12px 0',
            borderBottom: '1px solid var(--neutral-200)',
            gridTemplateColumns: '1fr auto',
          }}
        >
          <VStack gap={0} style={{ flex: 1, minWidth: 0 }}>
            <UIText
              kind="body/accent"
              style={{
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {label}
            </UIText>
            <UIText
              kind="small/regular"
              color="var(--neutral-600)"
              style={{
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {displayName}
              {leverage != null ? ` · ${leverage}x` : ''}
              {' · @'}
              {formatPriceValue(px, 'en', currency)}
            </UIText>
          </VStack>
          <UIText
            kind="body/regular"
            color={trailingColor}
            style={{ flexShrink: 0 }}
          >
            {trailing}
          </UIText>
        </HStack>
      </HStack>
    </UnstyledLink>
  );
}

const LEDGER_LABELS: Record<NonFundingLedgerUpdateType, string> = {
  deposit: 'Deposit',
  withdraw: 'Withdraw',
  send: 'Send',
  internalTransfer: 'Internal Transfer',
};

function getLedgerAmount(update: NonFundingLedgerUpdate): number {
  const { delta } = update;
  if (delta.usdc != null) return Number(delta.usdc);
  if (delta.usdcValue != null) return Number(delta.usdcValue);
  return 0;
}

export function PerpsHistoryLedgerRow({
  update,
}: {
  update: NonFundingLedgerUpdate;
}) {
  const { currency } = useCurrency();
  const type = update.delta.type;
  const amount = getLedgerAmount(update);
  const formatted = formatCurrencyValue(Math.abs(amount), 'en', currency);
  const trailing =
    type === 'deposit'
      ? { text: `+${formatted}`, color: 'var(--positive-500)' }
      : type === 'send'
      ? { text: `-${formatted}`, color: 'var(--negative-500)' }
      : { text: formatted, color: undefined };
  const isInbound = type === 'deposit';

  return (
    <HStack
      gap={12}
      alignItems="center"
      style={{
        paddingLeft: 16,
        width: '100%',
        gridTemplateColumns: 'auto 1fr',
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          flexShrink: 0,
          borderRadius: '50%',
          backgroundColor: 'var(--neutral-200)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <ArrowDownIcon
          style={{
            width: 16,
            height: 16,
            color: 'var(--neutral-700)',
            transform: isInbound ? undefined : 'rotate(180deg)',
          }}
        />
      </div>
      <HStack
        gap={12}
        alignItems="center"
        style={{
          minWidth: 0,
          padding: '12px 16px 12px 0',
          borderBottom: '1px solid var(--neutral-200)',
          gridTemplateColumns: '1fr auto',
        }}
      >
        <UIText
          kind="body/accent"
          style={{
            flex: 1,
            minWidth: 0,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {LEDGER_LABELS[type]}
        </UIText>
        <UIText
          kind="body/regular"
          color={trailing.color}
          style={{ flexShrink: 0 }}
        >
          {trailing.text}
        </UIText>
      </HStack>
    </HStack>
  );
}
