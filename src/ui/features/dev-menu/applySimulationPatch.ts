import BigNumber from 'bignumber.js';
import type { Warning } from 'src/modules/zerion-api/requests/wallet-simulate-transaction';
import type {
  AddressAction,
  Amount,
  Transfer,
} from 'src/modules/zerion-api/requests/wallet-get-actions';
import type {
  DevMenuState,
  SimulationOutputDiscrepancy,
  SimulationStatusOverride,
  SimulationWarningOverride,
} from './store-types';

const OUTPUT_DISCREPANCY_FACTOR = 0.5;

function makeInjectedWarning(
  severity: Exclude<SimulationWarningOverride, 'off'>
): Warning {
  return {
    severity,
    title: `[Dev] Injected ${severity} warning`,
    description: 'Forced by Dev Menu',
    details: '',
  };
}

function applyWarningOverride(
  warnings: Warning[],
  override: SimulationWarningOverride
): Warning[] {
  if (override === 'off') return warnings;
  return [...warnings, makeInjectedWarning(override)];
}

function applyStatusOverride(
  action: AddressAction,
  override: SimulationStatusOverride
): AddressAction {
  if (override === 'off') return action;
  // override === 'failed' — write to top-level action AND every nested act
  return {
    ...action,
    status: 'failed',
    acts: action.acts
      ? action.acts.map((a) => ({ ...a, status: 'failed' as const }))
      : action.acts,
  };
}

function scaleAmount(amount: Amount, factor: number): Amount {
  const scaledQuantity = new BigNumber(amount.quantity)
    .times(factor)
    .integerValue(BigNumber.ROUND_DOWN)
    .toFixed(0);
  return {
    ...amount,
    quantity: scaledQuantity,
    value: amount.value == null ? amount.value : amount.value * factor,
    usdValue:
      amount.usdValue == null ? amount.usdValue : amount.usdValue * factor,
  };
}

function scaleIncomingTransfer(transfer: Transfer, factor: number): Transfer {
  if (transfer.direction !== 'in') return transfer;
  if (transfer.nft) return transfer; // skip NFTs
  if (!transfer.amount) return transfer; // skip null amounts
  return { ...transfer, amount: scaleAmount(transfer.amount, factor) };
}

function applyOutputDiscrepancy(
  action: AddressAction,
  override: SimulationOutputDiscrepancy
): AddressAction {
  if (override === 'off') return action;
  if (!action.content || !action.content.transfers) return action;
  const factor = OUTPUT_DISCREPANCY_FACTOR;
  return {
    ...action,
    content: {
      ...action.content,
      transfers: action.content.transfers.map((t) =>
        scaleIncomingTransfer(t, factor)
      ),
    },
  };
}

type Patchable = {
  data: { action: AddressAction | null; warnings: Warning[] };
  errors?: { title: string; detail: string }[];
};

/**
 * Best-effort transformation of a simulation result based on dev-menu overrides.
 * - Returns input as-is when result is null/undefined or all overrides are off.
 * - Never fabricates scaffolding (no synthetic action/data when missing).
 * - Generic-preserving: returns the same response shape it was given.
 */
export function applySimulationPatch<T extends Patchable | null | undefined>(
  result: T,
  state: DevMenuState
): T {
  if (!result) return result;
  if (
    state.simulationWarningOverride === 'off' &&
    state.simulationStatusOverride === 'off' &&
    state.simulationOutputDiscrepancy === 'off'
  ) {
    return result;
  }

  const patchedWarnings = applyWarningOverride(
    result.data.warnings,
    state.simulationWarningOverride
  );

  let patchedAction = result.data.action;
  if (patchedAction) {
    patchedAction = applyStatusOverride(
      patchedAction,
      state.simulationStatusOverride
    );
    patchedAction = applyOutputDiscrepancy(
      patchedAction,
      state.simulationOutputDiscrepancy
    );
  }

  return {
    ...result,
    data: {
      ...result.data,
      action: patchedAction,
      warnings: patchedWarnings,
    },
  } as T;
}
