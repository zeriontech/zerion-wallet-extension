import { ethers } from 'ethers';
import { invariant } from 'src/shared/invariant';
import { parseApprove } from './describeTransaction';

export async function createApprovalTransaction(params: {
  contractAddress: string;
  spenderAddress: string;
  amountBase: string;
}): Promise<{ to: string; data: string }> {
  const { contractAddress, spenderAddress, amountBase } = params;
  const abi = [
    'function approve(address, uint256) public returns (bool success)',
  ];
  const contract = new ethers.Contract(contractAddress, abi);
  return contract.approve.populateTransaction(spenderAddress, amountBase);
}

export async function modifyApproveAmount<
  T extends { data?: string; to?: string }
>(transaction: T, amountBase: string) {
  const parsed = parseApprove(transaction);
  invariant(parsed?.type === 'approve', 'Failed to parse approval transaction');
  const newApproval = await createApprovalTransaction({
    contractAddress: parsed.contractAddress,
    spenderAddress: parsed.spenderAddress,
    amountBase,
  });
  invariant(
    transaction.to === newApproval.to,
    "new approval doesn't match incoming transaction"
  );
  return {
    ...transaction,
    ...newApproval,
  };
}
