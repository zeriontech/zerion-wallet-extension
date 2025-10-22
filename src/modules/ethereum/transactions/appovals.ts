import BigNumber from 'bignumber.js';
import { ethers } from 'ethers';
import { invariant } from 'src/shared/invariant';
import { produce } from 'immer';
import { UNLIMITED_APPROVAL_AMOUNT } from '../constants';
import { parseApprove } from './describeTransaction';
import type { AnyAddressAction } from './addressAction';

export function isUnlimitedApproval(value?: BigNumber.Value | null) {
  return new BigNumber(value?.toString() || 0).gte(UNLIMITED_APPROVAL_AMOUNT);
}

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

export function applyCustomAllowance({
  addressAction,
  customAllowanceQuantityCommon,
  customAllowanceQuantityBase,
}: {
  addressAction?: AnyAddressAction;
  customAllowanceQuantityCommon: string | null;
  customAllowanceQuantityBase: string | null;
}) {
  if (
    customAllowanceQuantityCommon == null ||
    addressAction?.acts?.length !== 1 ||
    addressAction.acts[0].content?.approvals?.length !== 1
  ) {
    return addressAction;
  }
  return produce(addressAction, (draft) => {
    if (draft.acts?.[0].content?.approvals?.[0]) {
      if (draft.acts[0].content.approvals[0].amount) {
        draft.acts[0].content.approvals[0].amount.quantity =
          customAllowanceQuantityCommon;
      } else {
        draft.acts[0].content.approvals[0].amount = {
          quantity: customAllowanceQuantityCommon,
          value: null,
          usdValue: null,
          currency: '',
        };
      }
      if (customAllowanceQuantityBase != null) {
        draft.acts[0].content.approvals[0].unlimited = isUnlimitedApproval(
          customAllowanceQuantityBase
        );
      }
    }
  });
}
