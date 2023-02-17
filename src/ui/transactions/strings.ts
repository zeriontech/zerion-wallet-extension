import { TransactionAction } from 'src/modules/ethereum/transactions/describeTransaction';

export const strings = {
  actions: {
    [TransactionAction.multicall]: 'Multicall',
    [TransactionAction.approve]: 'Token Allowance',
    [TransactionAction.transfer]: 'Transfer Token',
    [TransactionAction.swap]: 'Transaction',
    [TransactionAction.supply]: 'Supply',
    [TransactionAction.deposit]: 'Deposit',
    [TransactionAction.stake]: 'Stake',
    [TransactionAction.unstake]: 'Unstake',
    [TransactionAction.claim]: 'Claim',
    [TransactionAction.mint]: 'Mint',
    [TransactionAction.withdraw]: 'Withdraw',
    [TransactionAction.setApprovalForAll]: 'Batch Approval',
    [TransactionAction.send]: 'Send Token',
    [TransactionAction.contractInteraction]: 'Contract Interaction',
  },
};
