import type { InterpretResponse } from 'src/modules/zerion-api/requests/wallet-simulate-transaction';
import type { SignatureInterpretResponse } from 'src/modules/zerion-api/requests/wallet-simulate-signature';
import type { NetworksSource } from 'src/modules/zerion-api/shared';
import type { MultichainTransaction } from 'src/shared/types/MultichainTransaction';
import type { Quote2 } from 'src/shared/types/Quote';
import { isIntentQuote } from 'src/shared/types/Quote';
import { ZerionAPI } from 'src/modules/zerion-api/zerion-api.client';
import { prepareTypedDataForSigning } from 'src/modules/ethereum/message-signing/prepareTypedDataForSigning';
import { interpretTxBasedOnEligibility } from 'src/ui/shared/requests/uiInterpretTransaction';

export type SimulationResult =
  | InterpretResponse
  | SignatureInterpretResponse
  | null;

/** Warnings from both apply; the interpreted action comes from the intent when it has one */
export function mergeSimulationResults(
  transactions: SimulationResult,
  signature: SignatureInterpretResponse | null
): SimulationResult {
  if (!signature) return transactions;
  if (!transactions || !('data' in transactions) || !transactions.data) {
    return signature;
  }
  return {
    ...signature,
    data: {
      action: signature.data.action ?? transactions.data.action,
      warnings: [
        ...(transactions.data.warnings ?? []),
        ...(signature.data.warnings ?? []),
      ],
    },
  };
}

/**
 * Simulates the transactions of a quote, and the EVM Swap Intent through
 * simulate-signature on the typed data that will be signed. Solana intents
 * are not simulated.
 */
export async function simulateSwapQuote({
  address,
  chain,
  quote,
  transactions,
  currency,
  origin,
  source,
}: {
  address: string;
  chain: string;
  quote: Quote2;
  transactions: MultichainTransaction[];
  currency: string;
  origin: string;
  source: NetworksSource;
}): Promise<SimulationResult> {
  const transactionsResult = transactions.length
    ? await interpretTxBasedOnEligibility({
        address,
        transactions,
        eligibilityQueryData: false,
        eligibilityQueryStatus: 'success',
        currency,
        origin,
      })
    : null;
  const intentDocument = isIntentQuote(quote) ? quote.intentSwap.evm : null;
  if (!intentDocument) {
    return transactionsResult;
  }
  const signatureResult = await ZerionAPI.walletSimulateSignature(
    {
      address,
      chain,
      currency,
      domain: origin,
      signature: { typedData: prepareTypedDataForSigning(intentDocument) },
    },
    { source }
  );
  return mergeSimulationResults(transactionsResult, signatureResult);
}
