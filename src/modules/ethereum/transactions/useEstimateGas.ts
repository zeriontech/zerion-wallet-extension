import { useNetworks } from 'src/modules/networks/useNetworks';
import { useQuery, keepPreviousData as keepPreviousDataPlaceholder } from '@tanstack/react-query';
import type { IncomingTransaction } from '../types/IncomingTransaction';
import { estimateGas } from './fetchAndAssignGasPrice';

export function useEstimateGas({
  transaction,
  keepPreviousData = false,
}: {
  transaction: IncomingTransaction | null;
  keepPreviousData?: boolean;
}) {
  const { networks } = useNetworks();
  return useQuery({
    queryKey: ['estimateGas', transaction, networks],
    queryFn: () => (networks && transaction ? estimateGas(transaction, networks) : null),
    enabled: Boolean(networks && transaction),
    placeholderData: keepPreviousData ? keepPreviousDataPlaceholder : undefined,
  });
}
