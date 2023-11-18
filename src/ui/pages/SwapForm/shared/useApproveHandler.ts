import { useQuery } from '@tanstack/react-query';
import BigNumber from 'bignumber.js';
import { useMemo } from 'react';
import { UNLIMITED_APPROVAL_AMOUNT } from 'src/modules/ethereum/constants';
import type { Chain } from 'src/modules/networks/Chain';
import { invariant } from 'src/shared/invariant';
import { walletPort } from 'src/ui/shared/channels';

export function useApproveHandler({
  address,
  spendAmountBase,
  contractAddress,
  spender,
  chain,
}: {
  address: string;
  spendAmountBase: string | null;
  contractAddress: string | null;
  spender: string | null;
  chain: Chain | null;
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
    suspense: false,
    enabled: Boolean(contractAddress && spender && chain),
    useErrorBoundary: true,
  });
  const allowance = allowanceQuery.data;
  console.log(allowanceQuery);
  const enough = useMemo(() => {
    if (allowance == null || spendAmountBase == null) {
      return true;
    }
    return new BigNumber(allowance).gte(spendAmountBase);
  }, [allowance, spendAmountBase]);

  const approveTransactionQuery = useQuery({
    queryKey: [
      'wallet/createApprovalTransaction',
      contractAddress,
      spender,
      chain,
    ],
    queryFn: async () => {
      invariant(
        contractAddress && spender && chain,
        'Allowance params are missing'
      );
      return walletPort.request('createApprovalTransaction', {
        chain: chain.toString(),
        contractAddress,
        spender,
        allowanceQuantityBase: UNLIMITED_APPROVAL_AMOUNT.toFixed(),
      });
    },
    staleTime: Infinity,
    suspense: false,
    enabled: allowanceQuery.isSuccess && !enough,
  });

  return {
    allowanceQuery,
    enough_allowance: enough,
    approveTransactionQuery,
    transaction: approveTransactionQuery.data,
  };
}
