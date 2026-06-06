import { produce } from 'immer';
import { getNetworksStore } from 'src/modules/networks/networks-store.client';
import { estimateGasForNetwork } from 'src/modules/ethereum/transactions/fetchAndAssignGasPrice';
import { resolveChainId } from 'src/modules/ethereum/transactions/resolveChainId';
import { getGas } from 'src/modules/ethereum/transactions/getGas';
import { fetchGasPrice } from 'src/modules/ethereum/transactions/gasPrices/requests';
import { assignGasPrice } from 'src/modules/ethereum/transactions/gasPrices/assignGasPrice';
import { ZerionAPI } from 'src/modules/zerion-api/zerion-api.client';
import { rejectAfterDelay } from 'src/shared/rejectAfterDelay';
import { getPreferences } from 'src/ui/features/preferences/usePreferences';
import type { SignStep } from './types';

const STALE_THRESHOLD_MS = 60_000;
const REFRESH_TIMEOUT_MS = 2_000;

export function isStepStale(enqueuedAt: number, now: number = Date.now()) {
  return now - enqueuedAt > STALE_THRESHOLD_MS;
}

/**
 * If the queue has been waiting long enough that the original gas estimate
 * may be wrong (e.g. user took >1min on a hardware confirmation), re-run
 * eth_estimateGas and refetch gas prices, then replace the corresponding
 * fields on the transaction.
 *
 * Solana steps are skipped — only EVM has eth_estimateGas. Errors are
 * swallowed: a refresh failure shouldn't block a tx the user already
 * approved; we fall through to the original values.
 */
export async function refreshStaleGasForStep(
  step: SignStep
): Promise<SignStep> {
  if (step.kind !== 'send') return step;
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

    const previousGasRaw = getGas(tx);
    const previousGas = previousGasRaw == null ? null : Number(previousGasRaw);
    const fresh = gasResult.status === 'fulfilled' ? gasResult.value : null;
    const freshPrice =
      priceResult.status === 'fulfilled' ? priceResult.value : null;

    const shouldUpdateGas =
      fresh != null &&
      (previousGas == null ||
        !Number.isFinite(previousGas) ||
        fresh > previousGas);
    if (!shouldUpdateGas && !freshPrice) return step;

    return produce(step, (draft) => {
      if (draft.kind !== 'send' || !draft.params.transaction.evm) return;
      const evm = draft.params.transaction.evm;
      if (shouldUpdateGas) {
        delete evm.gas;
        evm.gasLimit = fresh;
      }
      if (freshPrice) {
        assignGasPrice(evm, freshPrice.fast);
      }
    });
  } catch {
    return step;
  }
}
