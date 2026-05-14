import { useMutation } from '@tanstack/react-query';
import { useCallback } from 'react';
import { useCurrency } from 'src/modules/currency/useCurrency';
import { applySimulationPatch } from 'src/ui/features/dev-menu/applySimulationPatch';
import { devMenuStore } from 'src/ui/features/dev-menu/store';
import { interpretTxBasedOnEligibility } from 'src/ui/shared/requests/uiInterpretTransaction';
import type { MultichainTransaction } from 'src/shared/types/MultichainTransaction';
import type { SimulationResult } from 'src/ui/pages/SwapForm2/SwapButton';

export type ButtonState = 'idle' | 'simulating';

export function useSendSimulation({
  address,
  transaction,
  simulated,
  onSimulationCompleted,
  onSign,
}: {
  address: string;
  transaction: MultichainTransaction | null;
  simulated: boolean;
  onSimulationCompleted: (result: SimulationResult) => void;
  onSign: () => void;
}) {
  const { currency } = useCurrency();

  const simulationMutation = useMutation({
    mutationFn: (txs: MultichainTransaction[]) =>
      interpretTxBasedOnEligibility({
        address,
        transactions: txs,
        eligibilityQueryData: false,
        eligibilityQueryStatus: 'success',
        currency,
        origin: 'https://app.zerion.io',
      }),
    onSettled: (data) => {
      const patched = applySimulationPatch(data, devMenuStore.getState());
      onSimulationCompleted(patched ?? null);
    },
  });

  const state: ButtonState = simulationMutation.isLoading
    ? 'simulating'
    : 'idle';

  const fire = useCallback(() => {
    if (simulated) {
      onSign();
      return;
    }
    if (!transaction) return;
    simulationMutation.mutate([transaction]);
  }, [simulated, onSign, transaction, simulationMutation]);

  return { state, fire };
}
