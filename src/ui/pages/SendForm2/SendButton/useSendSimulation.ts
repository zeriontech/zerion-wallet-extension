import { useCallback } from 'react';
import {
  useSimulateTransactions,
  type SimulationResult,
} from 'src/ui/shared/requests/useSimulateTransactions';
import type { MultichainTransaction } from 'src/shared/types/MultichainTransaction';

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
  onSimulationCompleted: (result: SimulationResult, transaction: MultichainTransaction) => void;
  onSign: () => void;
}) {
  const simulationMutation = useSimulateTransactions({
    address,
    onSettled: (result, transactions) => onSimulationCompleted(result, transactions[0]),
  });

  const state: ButtonState = simulationMutation.isLoading ? 'simulating' : 'idle';

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
