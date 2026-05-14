import { useMemo } from 'react';
import {
  computeEffectiveAccountValueUSD,
  computeEffectiveWithdrawableUSDC,
} from '../computeEffectiveValues';
import type { SpotBalance } from '../api/requests/spot-clearinghouse-state.types';
import type { AbstractionMode } from '../api/requests/user-abstraction.types';
import { isUnifiedMode } from '../api/requests/user-abstraction.types';
import type { PerpPosition } from '../api/requests/perp-clearinghouse-state.types';
import type { DexIdentifier } from '../api/requests/perp-dexs.types';
import { useClearinghouseStates } from './useClearinghouseStates';
import { useSpotClearinghouseState } from './useSpotClearinghouseState';
import { useUserAbstraction } from './useUserAbstraction';

interface UseHyperliquidAccountSummaryResult {
  isLoading: boolean;
  // True once the abstraction-mode query has resolved at least once. UI uses
  // this to skeleton the mode-dependent fields (effective account value /
  // withdrawable) without blocking the rest of the card.
  isModeReady: boolean;
  abstractionMode: AbstractionMode;
  isUnified: boolean;
  spotBalances: SpotBalance[];
  effectiveAccountValueUSD: number;
  effectiveWithdrawableUSDC: number;
  allPositions: PerpPosition[];
  dexesWithPositions: DexIdentifier[];
  // Sum of legacy `marginSummary.accountValue` across DEXes. Kept for
  // callers that need the pre-mode-aware number (analytics, debug, etc.).
  legacyTotalAccountValue: number;
}

export function useHyperliquidAccountSummary(
  { address }: { address: string | null | undefined },
  { enabled = true }: { enabled?: boolean } = {}
): UseHyperliquidAccountSummaryResult {
  const perp = useClearinghouseStates({ address }, { enabled });

  const spotQuery = useSpotClearinghouseState({ address }, { enabled });
  const abstractionQuery = useUserAbstraction({ address }, { enabled });

  const abstractionMode: AbstractionMode = abstractionQuery.data ?? 'disabled';
  const spotBalances = useMemo(
    () => spotQuery.data?.balances ?? [],
    [spotQuery.data]
  );

  const perpStates = useMemo(
    () => perp.perpStatesByDex,
    [perp.perpStatesByDex]
  );

  const effectiveAccountValueUSD = useMemo(
    () =>
      computeEffectiveAccountValueUSD({
        perpStates,
        spotBalances,
        abstractionMode,
      }),
    [perpStates, spotBalances, abstractionMode]
  );

  const effectiveWithdrawableUSDC = useMemo(
    () =>
      computeEffectiveWithdrawableUSDC({
        perpStates,
        spotBalances,
        abstractionMode,
      }),
    [perpStates, spotBalances, abstractionMode]
  );

  return {
    isLoading: perp.isLoading,
    isModeReady: !abstractionQuery.isLoading || abstractionQuery.data != null,
    abstractionMode,
    isUnified: isUnifiedMode(abstractionMode),
    spotBalances,
    effectiveAccountValueUSD,
    effectiveWithdrawableUSDC,
    allPositions: perp.allPositions,
    dexesWithPositions: perp.dexesWithPositions,
    legacyTotalAccountValue: perp.totalAccountValue,
  };
}
