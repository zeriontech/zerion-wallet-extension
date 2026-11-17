import { produce } from 'immer';
import { getNetworksStore } from 'src/modules/networks/networks-store.client';
import { estimateGasForNetwork } from 'src/modules/ethereum/transactions/fetchAndAssignGasPrice';
import { resolveChainId } from 'src/modules/ethereum/transactions/resolveChainId';
import { getGas } from 'src/modules/ethereum/transactions/getGas';
import { fetchGasPrice } from 'src/modules/ethereum/transactions/gasPrices/requests';
import { assignGasPrice } from 'src/modules/ethereum/transactions/gasPrices/assignGasPrice';
import { getFeeProvenance } from 'src/modules/ethereum/transactions/gasPrices/provenance';
import type { ChainGasPrice } from 'src/modules/ethereum/transactions/gasPrices/types';
import { ZerionAPI } from 'src/modules/zerion-api/zerion-api.client';
import { rejectAfterDelay } from 'src/shared/rejectAfterDelay';
import { getPreferences } from 'src/ui/features/preferences/usePreferences';
import type { SignStep } from './types';

const STALE_THRESHOLD_MS = 10_000;
const REFRESH_TIMEOUT_MS = 2_000;

/**
 * Whether the gas snapshot the step was built from is older than the refresh
 * threshold. `feeUpdatedAt` records when the applied gas prices were fetched;
 * callers that cannot supply it fall back to the queue enqueue time.
 */
export function isStepStale(step: SignStep, enqueuedAt: number, now: number = Date.now()) {
  const feeUpdatedAt = step.kind === 'send' ? step.params.feeUpdatedAt : null;
  const since = feeUpdatedAt != null && feeUpdatedAt > 0 ? feeUpdatedAt : enqueuedAt;
  return now - since > STALE_THRESHOLD_MS;
}

/**
 * Apply a fresh estimate and/or price snapshot to a step, preserving the
 * user's selected speed. Pure so the speed/provenance behaviour is testable.
 * `custom` fees are absolute user choices and are left untouched.
 */
export function applyStaleGas(
  step: SignStep,
  {
    freshGas,
    freshPrice,
    now = Date.now(),
  }: {
    freshGas: number | null;
    freshPrice: ChainGasPrice | null;
    now?: number;
  },
): SignStep {
  if (step.kind !== 'send' || !step.params.transaction.evm) {
    return step;
  }
  const speed = step.params.feeSpeed ?? 'fast';
  if (speed === 'custom') {
    return step;
  }
  const tx = step.params.transaction.evm;
  const previousGasRaw = getGas(tx);
  const previousGas = previousGasRaw == null ? null : Number(previousGasRaw);
  const shouldUpdateGas =
    freshGas != null &&
    (previousGas == null || !Number.isFinite(previousGas) || freshGas > previousGas);
  if (!shouldUpdateGas && !freshPrice) {
    return step;
  }
  return produce(step, (draft) => {
    if (draft.kind !== 'send' || !draft.params.transaction.evm) return;
    const evm = draft.params.transaction.evm;
    if (shouldUpdateGas && freshGas != null) {
      delete evm.gas;
      evm.gasLimit = freshGas;
    }
    if (freshPrice) {
      assignGasPrice(evm, freshPrice[speed]);
      const provenance = getFeeProvenance(freshPrice, speed);
      draft.params.feeBlock = provenance?.block ?? null;
      draft.params.feeSource = provenance?.source ?? null;
      draft.params.feeFormulaVersion = provenance?.formulaVersion ?? null;
    }
    draft.params.feeUpdatedAt = now;
  });
}

/**
 * If the gas snapshot has gone stale (the user took >10s on a hardware
 * confirmation, or the form sat open), re-run eth_estimateGas and refetch gas
 * prices, then replace the corresponding fields on the transaction while
 * keeping the user's selected speed.
 *
 * Solana steps and custom fees are skipped. Errors are swallowed: a refresh
 * failure shouldn't block a tx the user already approved; we fall through to
 * the original values.
 */
export async function refreshStaleGasForStep(step: SignStep): Promise<SignStep> {
  if (step.kind !== 'send') return step;
  if (step.params.feeSpeed === 'custom') return step;
  const tx = step.params.transaction.evm;
  if (!tx) return step;

  try {
    const networksStore = await getNetworksStore();
    const chainIdHex = resolveChainId(tx);
    const network = await networksStore.fetchNetworkById(chainIdHex);
    const preferences = await getPreferences();
    const source = preferences.testnetMode?.on ? 'testnet' : 'mainnet';

    // 2s budget per request — if the network is slow, don't hold up a tx
    // the user already approved; fall back to whatever gas/price was set
    // when the queue was created. Timeouts surface as rejected results.
    const [gasResult, priceResult] = await Promise.allSettled([
      Promise.race([
        estimateGasForNetwork(tx, network),
        rejectAfterDelay(REFRESH_TIMEOUT_MS, 'refreshStaleGas: estimateGas'),
      ]),
      Promise.race([
        fetchGasPrice({ network, source, apiClient: ZerionAPI }),
        rejectAfterDelay(REFRESH_TIMEOUT_MS, 'refreshStaleGas: fetchGasPrice'),
      ]),
    ]);

    const freshGas = gasResult.status === 'fulfilled' ? gasResult.value : null;
    const freshPrice = priceResult.status === 'fulfilled' ? priceResult.value : null;
    return applyStaleGas(step, { freshGas, freshPrice });
  } catch {
    return step;
  }
}
