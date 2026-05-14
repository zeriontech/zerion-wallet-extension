import BigNumber from 'bignumber.js';
import type { Quote2 } from 'src/shared/types/Quote';
import type { QuotesData } from 'src/ui/shared/requests/useQuotes';
import { getError } from 'src/shared/errors/getError';
import type { NetworkConfig } from 'src/modules/networks/NetworkConfig';
import type { SwapFormState2 } from '../types';
import {
  pickHighestNonGray,
  readSimulationStatus,
  readSimulationWarnings,
  severityToVariant,
} from './simulationWarningHelpers';
import type {
  ResolvedTransactionWarning,
  SimulationResult,
  WarningContent,
  WarningVariant,
} from './simulationWarningHelpers';

export type {
  ResolvedTransactionWarning,
  SimulationResult,
  WarningContent,
  WarningVariant,
};

const OUTPUT_MISMATCH_EPSILON = 0.01;

interface SimulatedOutput {
  /** Sum of incoming transfers matching the output fungible. */
  actualQuantity: BigNumber | null;
  /** Number of transfers that matched. */
  matchCount: number;
  /** True if we have an action with content/transfers we could inspect. */
  inspectable: boolean;
}

function readSimulatedOutput(
  result: SimulationResult,
  outputFungibleId: string | undefined
): SimulatedOutput {
  if (!result || !('data' in result) || !result.data) {
    return { actualQuantity: null, matchCount: 0, inspectable: false };
  }
  const action = (result.data as { action?: unknown }).action as
    | {
        content?: {
          transfers?: Array<{
            direction: 'in' | 'out';
            amount: { quantity: string } | null;
            fungible: { id: string } | null;
          }> | null;
        } | null;
      }
    | null
    | undefined;
  if (!action) {
    return { actualQuantity: null, matchCount: 0, inspectable: false };
  }
  const transfers = action.content?.transfers;
  if (!transfers || transfers.length === 0) {
    return { actualQuantity: null, matchCount: 0, inspectable: false };
  }
  if (!outputFungibleId) {
    return { actualQuantity: null, matchCount: 0, inspectable: true };
  }
  const incoming = transfers.filter(
    (t) =>
      t.direction === 'in' &&
      t.fungible != null &&
      t.fungible.id === outputFungibleId
  );
  if (incoming.length === 0) {
    return { actualQuantity: null, matchCount: 0, inspectable: true };
  }
  const sum = incoming.reduce((acc, t) => {
    if (!t.amount) return acc;
    return acc.plus(new BigNumber(t.amount.quantity));
  }, new BigNumber(0));
  return {
    actualQuantity: sum,
    matchCount: incoming.length,
    inspectable: true,
  };
}

function resolveFormStateWarning({
  quote,
  quotesQuery,
  formState,
  inputNetwork,
  outputNetwork,
}: {
  quote: Quote2 | null;
  quotesQuery: QuotesData<Quote2>;
  formState: SwapFormState2;
  inputNetwork: NetworkConfig | null | undefined;
  outputNetwork: NetworkConfig | null | undefined;
}): WarningContent | null {
  if (!formState.inputAmount || Number(formState.inputAmount) === 0) {
    return null;
  }

  const sameChain =
    Boolean(formState.inputChain) &&
    formState.inputChain === formState.outputChain;

  if (inputNetwork && outputNetwork && !sameChain) {
    const unsupported = !inputNetwork.supports_bridging
      ? inputNetwork
      : !outputNetwork.supports_bridging
      ? outputNetwork
      : null;
    if (unsupported) {
      return {
        variant: 'warning',
        title: `${unsupported.name} doesn’t support bridging`,
        description: `Cross-chain swaps between ${inputNetwork.name} and ${outputNetwork.name} aren’t available. Pick another network or swap within the same network.`,
      };
    }
  }

  if (
    inputNetwork &&
    outputNetwork &&
    sameChain &&
    !inputNetwork.supports_trading
  ) {
    return {
      variant: 'warning',
      title: `${inputNetwork.name} doesn’t support trading`,
      description: `Tokens on ${inputNetwork.name} can’t be swapped within the same network. Try bridging to a network that supports trading.`,
    };
  }

  if (quote?.error) {
    if (quote.error.code === 1) {
      return {
        variant: 'warning',
        title: 'Insufficient balance',
        description: quote.error.message,
      };
    }
    if (quote.error.code === 2) {
      return {
        variant: 'warning',
        title: 'Insufficient gas balance',
        description: quote.error.message,
      };
    }
    return {
      variant: 'error',
      title: 'Transaction will fail',
      description: quote.error.message,
    };
  }

  if (quotesQuery.error && !quotesQuery.isLoading) {
    return {
      variant: 'warning',
      title: 'Unable to fetch quotes',
      description: getError(quotesQuery.error).message,
    };
  }

  const shouldHaveQuotes = Boolean(
    formState.inputAmount &&
      formState.inputFungibleId &&
      formState.outputFungibleId
  );
  if (
    shouldHaveQuotes &&
    !quotesQuery.isLoading &&
    quotesQuery.done &&
    (!quotesQuery.quotes || quotesQuery.quotes.length === 0)
  ) {
    return {
      variant: 'warning',
      title: 'No providers available',
      description: 'This pair can’t be swapped right now.',
    };
  }

  return null;
}

/**
 * Resolves the unified pre-sign warning state for the swap flow.
 *
 * Single source of truth for three coupled UI concerns:
 *   1. Which (if any) <TransactionWarning /> card to render.
 *   2. Whether <UnverifiedWarning /> should render (extends today's `isUnverified`).
 *   3. Whether to block auto-sign and show 'Proceed Anyway' on <SwapButton />.
 *
 * Priority order (only one card may show):
 *   1. API severity warnings (Red > Orange > Yellow)
 *   2. simulation status === 'failed'
 *   3. Output mismatch (diff > max(1%, quote.finalSlippage), either direction)
 *   4. Existing form-state warnings (insufficient balance, no providers, etc.)
 *
 * `unverified` is true whenever the simulation didn't return enough data to
 * inspect — Gray severity, missing action/transfers, no matching output
 * transfer, or multiple matching transfers.
 *
 * See `CONTEXT.md` and `docs/adr/0001-output-mismatch-uses-epsilon-not-percentage.md`.
 */
export function resolveTransactionWarning({
  quote,
  quotesQuery,
  formState,
  simulationResult,
  inputNetwork,
  outputNetwork,
}: {
  quote: Quote2 | null;
  quotesQuery: QuotesData<Quote2>;
  formState: SwapFormState2;
  simulationResult: SimulationResult;
  inputNetwork: NetworkConfig | null | undefined;
  outputNetwork: NetworkConfig | null | undefined;
}): ResolvedTransactionWarning {
  const warnings = readSimulationWarnings(simulationResult);
  const status = readSimulationStatus(simulationResult);

  // --- Unverified detection (parallel to <UnverifiedWarning />) ---
  const hasGraySeverity = warnings.some((w) => w.severity === 'Gray');

  // The five edge cases for the output check, lifted to the unverified signal.
  // We only consider them "unverified" once a simulation has been attempted —
  // i.e., simulationResult is non-null. Pre-simulation, there's nothing to
  // verify yet and the danger button isn't in play.
  const isCrossChain =
    Boolean(formState.inputChain) &&
    Boolean(formState.outputChain) &&
    formState.inputChain !== formState.outputChain;
  let unverifiedFromSimGaps = false;
  if (simulationResult != null && formState.outputFungibleId) {
    const out = readSimulatedOutput(
      simulationResult,
      formState.outputFungibleId
    );
    // No action / no transfers / no matching transfer / multiple matches.
    if (!out.inspectable) {
      unverifiedFromSimGaps = true;
    } else if (out.matchCount === 0) {
      // Cross-chain swaps land the output on the destination chain, so the
      // source-chain simulation legitimately has no matching incoming transfer.
      if (!isCrossChain) {
        unverifiedFromSimGaps = true;
      }
    } else if (out.matchCount > 1) {
      unverifiedFromSimGaps = true;
    }
  }

  const unverified = hasGraySeverity || unverifiedFromSimGaps;

  // --- TransactionWarning resolution, in priority order ---

  // 1. API severity warnings (Red > Orange > Yellow); first-in-array tiebreak.
  const topSeverity = pickHighestNonGray(warnings);
  if (topSeverity) {
    return {
      warning: {
        variant: severityToVariant(topSeverity.severity),
        title: topSeverity.title,
        description: topSeverity.description || undefined,
      },
      unverified,
      blocksAutoSign: true,
      dangerTitle: 'Proceed Anyway',
    };
  }

  // 2. simulation status === 'failed'
  if (status === 'failed') {
    return {
      warning: {
        variant: 'error',
        title: 'Transaction will fail',
        description:
          'The simulation reverted. Submitting this transaction will likely fail and waste gas.',
      },
      unverified,
      blocksAutoSign: true,
      dangerTitle: 'Proceed Anyway',
    };
  }

  // 3. Output mismatch (both directions). Threshold is the quote's
  //    finalSlippage when available (the user has already accepted that much
  //    drift), floored by OUTPUT_MISMATCH_EPSILON to absorb serialization
  //    artifacts.
  if (quote && formState.outputFungibleId && simulationResult) {
    const out = readSimulatedOutput(
      simulationResult,
      formState.outputFungibleId
    );
    if (out.inspectable && out.matchCount === 1 && out.actualQuantity != null) {
      const quoted = new BigNumber(quote.outputAmount.quantity);
      if (quoted.gt(0)) {
        const diff = out.actualQuantity.minus(quoted).abs().div(quoted);
        const slippageRatio =
          quote.finalSlippage != null ? quote.finalSlippage / 100 : 0;
        const threshold = Math.max(OUTPUT_MISMATCH_EPSILON, slippageRatio);
        if (diff.gt(threshold)) {
          const description =
            quote.finalSlippage != null
              ? `The difference between the simulated and quoted output exceeds the ${quote.finalSlippage}% slippage tolerance.`
              : 'The simulated result doesn’t match the quoted output. You may receive a different amount than shown.';
          return {
            warning: {
              variant: 'error',
              title: 'Output amount mismatch',
              description,
            },
            unverified,
            blocksAutoSign: true,
            dangerTitle: 'Proceed Anyway',
          };
        }
      }
    }
  }

  // 4. Existing form-state-derived warnings (informational; gating handled
  //    elsewhere via SwapButton's disabled state).
  const formStateWarning = resolveFormStateWarning({
    quote,
    quotesQuery,
    formState,
    inputNetwork,
    outputNetwork,
  });

  return {
    warning: formStateWarning,
    unverified,
    // Form-state warnings don't block auto-sign — the button is already
    // disabled by quote.error / missing quote / etc. Unverified does block,
    // matching today's behavior.
    blocksAutoSign: unverified,
    dangerTitle: null,
  };
}
