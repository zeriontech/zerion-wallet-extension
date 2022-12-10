import { TransactionAction } from 'src/modules/ethereum/transactions/describeTransaction';

export const strings = {
  actions: {
    [TransactionAction.multicall]: 'Multicall',
    [TransactionAction.approve]: 'Token Allowance',
    [TransactionAction.transfer]: 'Transfer Token',
    [TransactionAction.swap]: 'Transaction',
    [TransactionAction.deposit]: 'Deposit',
    [TransactionAction.withdraw]: 'Withdrawal',
    [TransactionAction.setApprovalForAll]: 'Batch approval',
    [TransactionAction.send]: 'Send Token',
    [TransactionAction.contractInteraction]: 'Contract Interaction',
  },
};
