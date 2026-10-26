import { nanoid } from 'nanoid';
import {
  ZERO_HASH,
  type LocalAddressAction,
} from 'src/modules/ethereum/transactions/addressAction';
import type {
  ActionChain,
  PendingAction,
} from 'src/modules/zerion-api/requests/wallet-get-actions';
import type { MultichainTransaction } from 'src/shared/types/MultichainTransaction';

/** The local History row of a signed pending action: it keeps the row's own type, label and content, never a generic "Trade". */
export function createLocalActionFromPendingAction({
  item,
  transaction,
  chain,
}: {
  item: PendingAction;
  transaction: MultichainTransaction;
  chain: ActionChain;
}): LocalAddressAction {
  const actionTransaction = {
    chain: item.transaction?.chain ?? chain,
    hash: null,
    explorerUrl: null,
  };
  return {
    id: nanoid(),
    address: item.address,
    timestamp: Date.now(),
    status: 'pending',
    type: item.type,
    label: item.label,
    fee: item.fee,
    refund: item.refund,
    content: item.content,
    transaction: actionTransaction,
    acts: item.acts.map((act) => ({
      type: act.type,
      label: act.label,
      content: act.content,
      rate: act.rate,
      status: 'pending',
      transaction: {
        chain: act.transaction.chain,
        hash: null,
        explorerUrl: null,
      },
    })),
    local: true,
    rawTransaction: transaction.evm
      ? {
          chain: chain.id,
          hash: ZERO_HASH,
          nonce: -1,
          from: transaction.evm.from ?? null,
          data:
            transaction.evm.data != null ? String(transaction.evm.data) : null,
          value: transaction.evm.value ?? undefined,
        }
      : { chain: chain.id, hash: ZERO_HASH, nonce: -1, from: item.address },
  };
}
