import type { SerializableTransactionResponse } from 'src/modules/ethereum/types/TransactionResponsePlain';
import { NetworkId } from 'src/modules/networks/NetworkId';
import type { TransactionContextParams } from 'src/shared/types/SignatureContextParams';
import type { FeeProvenance } from 'src/modules/ethereum/transactions/gasPrices/provenance';

export interface SignedTransactionFeeParams {
  fee_speed: TransactionContextParams['feeSpeed'] | 'fast';
  max_fee_per_gas: string | null;
  max_priority_fee_per_gas: string | null;
  fee_block: number | null;
  fee_source: string | null;
  fee_formula_version: string | null;
}

function toWeiString(value: string | number | null | undefined): string | null {
  if (value == null || value === '') {
    return null;
  }
  try {
    const wei = typeof value === 'number' ? BigInt(Math.round(value)) : BigInt(value);
    return wei > BigInt(0) ? wei.toString() : null;
  } catch {
    return null;
  }
}

/**
 * The six fee fields for `signed_transaction` (WLT-2749). Ethereum only; the
 * max fees describe what the wallet handed to the network, never a post-broadcast
 * lookup. `signedEvm` is null on failures, so only the descriptive fields remain.
 */
export function getSignedTransactionFeeParams({
  chain,
  context,
  signedEvm,
  provenance,
}: {
  chain: string;
  context: TransactionContextParams;
  signedEvm: SerializableTransactionResponse | null;
  provenance: FeeProvenance | null;
}): SignedTransactionFeeParams | Record<string, never> {
  if (chain !== NetworkId.Ethereum) {
    return {};
  }
  return {
    fee_speed: context.feeSpeed ?? 'fast',
    max_fee_per_gas: toWeiString(signedEvm?.maxFeePerGas),
    max_priority_fee_per_gas: toWeiString(signedEvm?.maxPriorityFeePerGas),
    fee_block: provenance?.block ?? null,
    fee_source: provenance?.source ?? null,
    fee_formula_version: provenance?.formulaVersion ?? null,
  };
}
