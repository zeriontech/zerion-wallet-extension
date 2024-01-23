import { useQuery } from '@tanstack/react-query';
import BigNumber from 'bignumber.js';
import { useMemo } from 'react';
import { estimateGas } from 'src/modules/ethereum/transactions/fetchAndAssignGasPrice';
import type { Chain } from 'src/modules/networks/Chain';
import { networksStore } from 'src/modules/networks/networks-store.client';
import { invariant } from 'src/shared/invariant';
import { valueToHex } from 'src/shared/units/valueToHex';
import { walletPort } from 'src/ui/shared/channels';

export function useApproveHandler({
  address,
  spendAmountBase,
  allowanceQuantityBase,
  contractAddress,
  spender,
  chain,
  enabled = true,
}: {
  address: string;
  spendAmountBase: string | null;
  allowanceQuantityBase: string;
  contractAddress: string | null;
  spender: string | null;
  chain: Chain | null;
  enabled?: boolean;
}) {
  const allowanceQuery = useQuery({
    queryKey: [
      'wallet/fetchAllowance',
      contractAddress,
      address,
      spender,
      chain,
    ],
    queryFn: () => {
      invariant(
        contractAddress && spender && chain,
        'Allowance params are missing'
      );
      return walletPort.request('fetchAllowance', {
        chain: chain.toString(),
        contractAddress,
        owner: address,
        spender,
      });
    },
    staleTime: 20000,
    keepPreviousData: true,
    suspense: false,
    enabled: Boolean(enabled && contractAddress && spender && chain),
    useErrorBoundary: true,
  });
  const allowance = allowanceQuery.data;
  const enough = useMemo(() => {
    if (allowance == null || spendAmountBase == null) {
      return true;
    }
    return new BigNumber(allowance).gte(spendAmountBase);
  }, [allowance, spendAmountBase]);

  const approvalTransactionQuery = useQuery({
    queryKey: [
      'wallet/createApprovalTransaction',
      contractAddress,
      spender,
      allowanceQuantityBase,
      chain,
      address,
    ],
    queryFn: async () => {
      invariant(
        contractAddress && spender && chain,
        'Allowance params are missing'
      );
      const approveTx = await walletPort.request('createApprovalTransaction', {
        chain: chain.toString(),
        contractAddress,
        spender,
        allowanceQuantityBase,
        // allowanceQuantityBase: '40000000000000000000', // TESTING
      });
      const tx = { ...approveTx, from: address };
      const networks = await networksStore.load();
      const gas = await estimateGas(tx, networks);
      const gasAsHex = valueToHex(gas);
      return { ...tx, gas: gasAsHex, gasLimit: gasAsHex };
    },
    staleTime: Infinity,
    keepPreviousData: true,
    suspense: false,
    enabled: allowanceQuery.isSuccess && !enough,
    // enabled: false,
  });

  return {
    allowanceQuery,
    enough_allowance: enough,
    approvalTransactionQuery,
    approvalTransaction: approvalTransactionQuery.data,
  };
}
