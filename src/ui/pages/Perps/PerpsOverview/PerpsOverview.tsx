import React, { useEffect, useMemo, useState } from 'react';
import QuestionHintIcon from 'jsx:src/ui/assets/question-hint.svg';
import { useClearinghouseStates } from 'src/modules/hyperliquid/hooks/useClearinghouseStates';
import { useHyperliquidAccountSummary } from 'src/modules/hyperliquid/hooks/useHyperliquidAccountSummary';
import { useNonFundingLedger } from 'src/modules/hyperliquid/hooks/useNonFundingLedger';
import { usePerpAssetCtxs } from 'src/modules/hyperliquid/hooks/usePerpAssetCtxs';
import { useUserFills } from 'src/modules/hyperliquid/hooks/useUserFills';
import { useCurrency } from 'src/modules/currency/useCurrency';
import { formatCurrencyToParts } from 'src/shared/units/formatCurrencyValue';
import { BlurrableBalance } from 'src/ui/components/BlurrableBalance';
import { NeutralDecimals } from 'src/ui/ui-kit/NeutralDecimals';
import type { PerpFill } from 'src/modules/hyperliquid/api/requests/perp-user-fills.types';
import type { NonFundingLedgerUpdate } from 'src/modules/hyperliquid/api/requests/perp-non-funding-ledger.types';
import { Button } from 'src/ui/ui-kit/Button';
import { HStack } from 'src/ui/ui-kit/HStack';
import { Dialog2, useDialog2 } from 'src/ui/ui-kit/ModalDialogs/Dialog2';
import { Spacer } from 'src/ui/ui-kit/Spacer';
import { UIText } from 'src/ui/ui-kit/UIText';
import { Frame } from 'src/ui/ui-kit/Frame';
import { UnstyledButton } from 'src/ui/ui-kit/UnstyledButton';
import { UnstyledLink } from 'src/ui/ui-kit/UnstyledLink';
import { useAddressParams } from 'src/ui/shared/user-address/useAddressParams';
import { usePreferences } from 'src/ui/features/preferences/usePreferences';
import { VStack } from 'src/ui/ui-kit/VStack';
import skeletonStyles from 'src/ui/pages/SwapForm2/styles.module.css';
import { PerpsOnboarding } from '../PerpsOnboarding';
import { PerpsPositionCard } from './PerpsPositionCard';
import { PerpsPositionsListSkeleton } from './PerpsPositionCardSkeleton';
import {
  PerpsHistoryLedgerRow,
  PerpsHistoryTradeRow,
} from './PerpsHistoryRows';

type PerpsHistoryItem =
  | { kind: 'fill'; time: number; data: PerpFill }
  | { kind: 'ledger'; time: number; data: NonFundingLedgerUpdate };

function dayStartMs(time: number): number {
  const date = new Date(time);
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate()
  ).getTime();
}

function groupByDay(
  items: PerpsHistoryItem[]
): { day: number; items: PerpsHistoryItem[] }[] {
  const groups = new Map<number, PerpsHistoryItem[]>();
  for (const item of items) {
    const key = dayStartMs(item.time);
    const bucket = groups.get(key);
    if (bucket) {
      bucket.push(item);
    } else {
      groups.set(key, [item]);
    }
  }
  return Array.from(groups.entries())
    .sort(([a], [b]) => b - a)
    .map(([day, items]) => ({ day, items }));
}

const PAGE_SIZE = 50;

const longDateFormatter = new Intl.DateTimeFormat('en', {
  month: 'long',
  day: 'numeric',
  year: 'numeric',
});

function PerpsPositionsList({ address }: { address: string }) {
  const {
    allPositions: positions,
    isLoading,
    dexesWithPositions,
  } = useClearinghouseStates({ address });
  const { coinToMarkPx } = usePerpAssetCtxs(dexesWithPositions, {
    enabled: dexesWithPositions.length > 0,
  });

  if (isLoading && positions.length === 0) {
    return <PerpsPositionsListSkeleton />;
  }

  if (positions.length === 0) {
    return (
      <div style={{ paddingInline: 16 }}>
        <Frame style={{ padding: '16px' }}>
          <VStack
            gap={16}
            style={{ justifyItems: 'stretch', textAlign: 'center' }}
          >
            <VStack gap={8} style={{ justifyItems: 'center' }}>
              <img
                src="https://cdn.zerion.io/images/dna-assets/perps_onboarding_1.png"
                srcSet="https://cdn.zerion.io/images/dna-assets/perps_onboarding_1.png 1x, https://cdn.zerion.io/images/dna-assets/perps_onboarding_1_2x.png 2x"
                alt="Perpetual futures illustration"
                style={{
                  display: 'block',
                  width: 120,
                  height: 60,
                  objectFit: 'cover',
                  filter: 'drop-shadow(0px 8px 24px rgba(32, 24, 50, 0.12))',
                }}
              />
              <VStack gap={4}>
                <UIText kind="headline/h3">Fund your wallet</UIText>
                <UIText kind="small/regular" color="var(--neutral-600)">
                  Trade with up to 40x Leverage
                </UIText>
              </VStack>
            </VStack>
            <Button
              size={40}
              kind="primary"
              as={UnstyledLink}
              to="/perps/deposit"
            >
              Deposit
            </Button>
          </VStack>
        </Frame>
      </div>
    );
  }

  return (
    <VStack gap={0}>
      {positions.map((position, index) => (
        <React.Fragment key={`${position.coin}|${position.szi}`}>
          {index > 0 ? (
            <div
              style={{
                backgroundColor: 'var(--neutral-200)',
                height: 1,
                marginInline: 8,
              }}
            />
          ) : null}
          <PerpsPositionCard
            position={position}
            markPx={coinToMarkPx.get(position.coin) ?? null}
          />
        </React.Fragment>
      ))}
    </VStack>
  );
}

function PerpsHistoryList({ address }: { address: string }) {
  const [visible, setVisible] = useState(PAGE_SIZE);
  const fillsQuery = useUserFills({ address });
  const ledgerQuery = useNonFundingLedger({ address });
  const { allPositions } = useClearinghouseStates({ address });

  const leverageByCoin = useMemo(() => {
    const map = new Map<string, number>();
    for (const position of allPositions) {
      // First-seen wins; multi-DEX duplicates of the same coin keep the
      // earliest (higher margin) entry's leverage.
      if (!map.has(position.coin)) {
        map.set(position.coin, position.leverage.value);
      }
    }
    return map;
  }, [allPositions]);

  const merged = useMemo<PerpsHistoryItem[]>(() => {
    const fills = fillsQuery.data ?? [];
    const ledger = ledgerQuery.data ?? [];
    const items: PerpsHistoryItem[] = [
      ...fills.map<PerpsHistoryItem>((data) => ({
        kind: 'fill',
        time: data.time,
        data,
      })),
      ...ledger.map<PerpsHistoryItem>((data) => ({
        kind: 'ledger',
        time: data.time,
        data,
      })),
    ];
    items.sort((a, b) => b.time - a.time);
    return items;
  }, [fillsQuery.data, ledgerQuery.data]);

  const slice = useMemo(() => merged.slice(0, visible), [merged, visible]);
  const grouped = useMemo(() => groupByDay(slice), [slice]);
  const hasMore = visible < merged.length;

  const isInitialLoading =
    (fillsQuery.isLoading || ledgerQuery.isLoading) && merged.length === 0;

  if (isInitialLoading) {
    return (
      <UIText
        kind="body/regular"
        color="var(--neutral-500)"
        style={{ padding: 24, textAlign: 'center' }}
      >
        Loading history…
      </UIText>
    );
  }

  if (merged.length === 0) {
    return (
      <UIText
        kind="body/regular"
        color="var(--neutral-500)"
        style={{ padding: 24, textAlign: 'center' }}
      >
        No perps activity yet
      </UIText>
    );
  }

  return (
    <VStack gap={16}>
      {grouped.map((group) => (
        <VStack gap={0} key={group.day}>
          <div style={{ padding: '8px 16px' }}>
            <UIText kind="small/accent" color="var(--neutral-700)">
              {longDateFormatter.format(group.day)}
            </UIText>
          </div>
          <VStack gap={0}>
            {group.items.map((item) =>
              item.kind === 'fill' ? (
                <PerpsHistoryTradeRow
                  key={`fill-${item.data.hash}-${item.data.tid}`}
                  fill={item.data}
                  leverage={leverageByCoin.get(item.data.coin) ?? null}
                />
              ) : (
                <PerpsHistoryLedgerRow
                  key={`ledger-${item.data.hash}-${item.time}`}
                  update={item.data}
                />
              )
            )}
          </VStack>
        </VStack>
      ))}
      {hasMore ? (
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <Button
            kind="regular"
            size={40}
            onClick={() => setVisible((v) => v + PAGE_SIZE)}
          >
            Show more
          </Button>
        </div>
      ) : null}
    </VStack>
  );
}

export function PerpsOverview() {
  const { singleAddress: address } = useAddressParams();
  const { currency } = useCurrency();
  const historyDialog = useDialog2();
  const { preferences, setPreferences } = usePreferences();
  const onboardingDismissed = preferences?.perpsOnboardingDismissed === true;
  const [onboardingOpen, setOnboardingOpen] = useState(!onboardingDismissed);

  useEffect(() => {
    if (onboardingDismissed) setOnboardingOpen(false);
  }, [onboardingDismissed]);

  const { effectiveAccountValueUSD, isModeReady } =
    useHyperliquidAccountSummary({ address });

  if (!address) {
    return null;
  }

  return (
    <VStack gap={16}>
      <HStack
        gap={8}
        alignItems="center"
        justifyContent="space-between"
        style={{ paddingInline: 16 }}
      >
        <HStack gap={6} alignItems="center">
          {isModeReady ? (
            <UIText kind="headline/h3">
              <BlurrableBalance kind="body/accent" color="var(--black)">
                <NeutralDecimals
                  parts={formatCurrencyToParts(
                    effectiveAccountValueUSD,
                    'en',
                    currency
                  )}
                />
              </BlurrableBalance>
            </UIText>
          ) : (
            <div
              className={skeletonStyles.skeleton}
              style={{ width: 128, height: 24 }}
            />
          )}
          <UnstyledButton
            type="button"
            onClick={() => setOnboardingOpen(true)}
            aria-label="What are perps?"
            title="What are perps?"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 24,
              height: 24,
              borderRadius: 12,
              color: 'var(--neutral-500)',
            }}
          >
            <QuestionHintIcon style={{ width: 18, height: 18 }} />
          </UnstyledButton>
        </HStack>
        <HStack gap={4} alignItems="center">
          <Button
            kind="ghost"
            size={32}
            as={UnstyledLink}
            to="/perps/deposit"
            title="Deposit"
            aria-label="Deposit"
            style={{ paddingInline: 8 }}
          >
            <UIText kind="small/accent">Deposit</UIText>
          </Button>
          <Button
            kind="ghost"
            size={32}
            as={UnstyledLink}
            to="/perps/withdraw"
            title="Withdraw"
            aria-label="Withdraw"
            style={{ paddingInline: 8 }}
          >
            <UIText kind="small/accent">Withdraw</UIText>
          </Button>
          <Button
            kind="ghost"
            size={32}
            title="History"
            aria-label="History"
            style={{ paddingInline: 8 }}
            onClick={historyDialog.openDialog}
          >
            <UIText kind="small/accent">History</UIText>
          </Button>
        </HStack>
      </HStack>
      <PerpsPositionsList address={address} />
      <Spacer height={16} />
      <Dialog2
        open={historyDialog.open}
        onClose={historyDialog.closeDialog}
        title="History"
      >
        <PerpsHistoryList address={address} />
        <Spacer height={16} />
      </Dialog2>
      <PerpsOnboarding
        open={onboardingOpen}
        onDismiss={() => {
          setOnboardingOpen(false);
          if (!onboardingDismissed) {
            setPreferences({ perpsOnboardingDismissed: true });
          }
        }}
      />
    </VStack>
  );
}
