import {
  pickHighestNonGray,
  readSimulationStatus,
  readSimulationWarnings,
  severityToVariant,
} from 'src/ui/pages/SwapForm2/TransactionWarning/simulationWarningHelpers';
import type {
  ResolvedTransactionWarning,
  SimulationResult,
} from 'src/ui/pages/SwapForm2/TransactionWarning/simulationWarningHelpers';
import type { TransactionPrepareError } from 'src/modules/zerion-api/types/TransactionPrepareError';

export type { ResolvedTransactionWarning, SimulationResult };

export function backendErrorToMessage(
  error: TransactionPrepareError,
  context: { assetSymbol?: string | null; nativeAssetSymbol?: string | null }
): string {
  if (error.code === 1) {
    const symbol = context.assetSymbol;
    return symbol ? `Insufficient ${symbol} balance` : 'Insufficient balance';
  }
  if (error.code === 2) {
    const symbol = context.nativeAssetSymbol;
    return symbol
      ? `Insufficient ${symbol} for gas`
      : 'Insufficient balance for gas';
  }
  return error.message;
}

/**
 * Send-flavor resolver: surfaces simulation severity warnings and failed
 * status. No output-mismatch tier (no quote to compare against) and no
 * form-state warnings (button disabled-state handles those for Send).
 *
 * `unverified` fires only on Gray severity — Send has no expected output
 * transfer to verify against.
 */
export function resolveSendTransactionWarning({
  simulationResult,
  backendError = null,
  assetSymbol = null,
  nativeAssetSymbol = null,
}: {
  simulationResult: SimulationResult;
  backendError?: TransactionPrepareError | null;
  assetSymbol?: string | null;
  nativeAssetSymbol?: string | null;
}): ResolvedTransactionWarning {
  if (backendError) {
    return {
      warning: {
        variant: 'error',
        title: backendErrorToMessage(backendError, {
          assetSymbol,
          nativeAssetSymbol,
        }),
        description: undefined,
      },
      unverified: false,
      blocksAutoSign: true,
      dangerTitle: null,
    };
  }

  const warnings = readSimulationWarnings(simulationResult);
  const status = readSimulationStatus(simulationResult);
  const hasGraySeverity = warnings.some((w) => w.severity === 'Gray');

  const topSeverity = pickHighestNonGray(warnings);
  if (topSeverity) {
    return {
      warning: {
        variant: severityToVariant(topSeverity.severity),
        title: topSeverity.title,
        description: topSeverity.description || undefined,
      },
      unverified: hasGraySeverity,
      blocksAutoSign: true,
      dangerTitle: 'Proceed Anyway',
    };
  }

  if (status === 'failed') {
    return {
      warning: {
        variant: 'error',
        title: 'Transaction will fail',
        description:
          'The simulation reverted. Submitting this transaction will likely fail and waste gas.',
      },
      unverified: hasGraySeverity,
      blocksAutoSign: true,
      dangerTitle: 'Proceed Anyway',
    };
  }

  return {
    warning: null,
    unverified: hasGraySeverity,
    blocksAutoSign: hasGraySeverity,
    dangerTitle: null,
  };
}
