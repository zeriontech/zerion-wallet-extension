import { useMemo } from 'react';
import { useStore } from '@store-unit/react';
import { transactionReceiptToActionStatus } from 'src/modules/ethereum/transactions/addressAction/creators';
import { localTransactionsStore } from 'src/ui/transactions/transactions-store';
import type { Chain } from 'src/modules/networks/Chain';
import { useQuery } from '@tanstack/react-query';
import { useNetworks } from 'src/modules/networks/useNetworks';
import { getTransactionReceipt } from 'src/modules/ethereum/transactions/getTransactionReceipt';
import { toEthersV5Receipt } from 'src/background/Wallet/model/ethers-v5-types';

export function useActionStatusByHash(hash: string | null, chain: Chain) {
  const localActions = useStore(localTransactionsStore);
  const localStatus = useMemo(() => {
    const action = localActions.find((item) => item.transaction.hash === hash);
    return action ? transactionReceiptToActionStatus(action) : null;
  }, [localActions, hash]);

  const { networks } = useNetworks();
  const rpcUrl = networks?.getRpcUrlInternal(chain);

  const { data } = useQuery({
    queryKey: ['getTransactionReceipt', hash, rpcUrl],
    queryFn: async () => {
      if (!hash || !rpcUrl) {
        return null;
      }
      return getTransactionReceipt({ hash, rpcUrl });
    },
    enabled: Boolean(!localStatus && rpcUrl && hash),
  });

  const ethersv5Receipt = data ? toEthersV5Receipt(data) : null;
  const nodeStatus = ethersv5Receipt
    ? transactionReceiptToActionStatus({ receipt: ethersv5Receipt })
    : null;

  return localStatus || nodeStatus || 'pending';
}
