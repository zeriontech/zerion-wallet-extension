import { useMutation } from '@tanstack/react-query';
import { useCurrency } from 'src/modules/currency/useCurrency';
import type { InterpretResponse } from 'src/modules/zerion-api/requests/wallet-simulate-transaction';
import type { SignatureInterpretResponse } from 'src/modules/zerion-api/requests/wallet-simulate-signature';
import type { MultichainTransaction } from 'src/shared/types/MultichainTransaction';
import { applySimulationPatch } from 'src/ui/features/dev-menu/applySimulationPatch';
import { devMenuStore } from 'src/ui/features/dev-menu/store';
import { interpretTxBasedOnEligibility } from './uiInterpretTransaction';

export type SimulationResult = InterpretResponse | SignatureInterpretResponse | null;

/**
 * Simulation of transactions the wallet formed itself (Send, Swap). These are
 * never sponsored, and the backend is told they originate from the Zerion web
 * app. `onSettled` receives `null` when the request failed or the network
 * does not support simulations.
 */
export function useSimulateTransactions({
  address,
  onSettled,
}: {
  address: string;
  onSettled: (result: SimulationResult, transactions: MultichainTransaction[]) => void;
}) {
  const { currency } = useCurrency();
  return useMutation({
    mutationFn: (transactions: MultichainTransaction[]) =>
      interpretTxBasedOnEligibility({
        address,
        transactions,
        eligibilityQueryData: false,
        eligibilityQueryStatus: 'success',
        currency,
        origin: 'https://app.zerion.io',
      }),
    onSettled: (data, _error, transactions) => {
      const patched = applySimulationPatch(data, devMenuStore.getState());
      onSettled(patched ?? null, transactions);
    },
  });
}
