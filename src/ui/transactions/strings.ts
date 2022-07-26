import { TransactionAction } from 'src/modules/ethereum/transactions/describeTransaction';

export const strings = {
  actions: {
    [TransactionAction.approve]: 'Token Allowance',
    [TransactionAction.transfer]: 'Send Token',
    [TransactionAction.swap]: 'Transaction',
    [TransactionAction.contractInteraction]: 'Contract Interaction',
  },
};
