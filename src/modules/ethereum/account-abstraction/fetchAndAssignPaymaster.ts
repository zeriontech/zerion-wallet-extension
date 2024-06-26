import { ethers } from 'ethers';
import { invariant } from 'src/shared/invariant';
import { valueToHex } from 'src/shared/units/valueToHex';
import { normalizeChainId } from 'src/shared/normalizeChainId';
import { ZerionAPI } from 'src/modules/zerion-api/zerion-api';
import { getGas } from '../transactions/getGas';
import type { IncomingTransaction } from '../types/IncomingTransaction';

function assertTransactionProps(
  tx: IncomingTransaction
): Required<
  Pick<
    IncomingTransaction,
    | 'from'
    | 'to'
    | 'nonce'
    | 'chainId'
    | 'gasLimit'
    | 'maxFeePerGas'
    | 'maxPriorityFeePerGas'
    | 'value'
    | 'data'
  >
> {
  const {
    from,
    to,
    nonce,
    chainId,
    maxFeePerGas,
    maxPriorityFeePerGas,
    data,
    value,
  } = tx;
  const gasLimit = getGas(tx);
  invariant(from, 'tx param missing: {from}');
  invariant(to, 'tx param missing: {to}');
  invariant(nonce != null, 'tx param missing: {nonce}');
  invariant(chainId, 'tx param missing: {chainId}');
  invariant(maxFeePerGas, 'tx param missing: {maxFeePerGas}');
  invariant(maxPriorityFeePerGas, 'tx param missing: {maxPriorityFeePerGas}');
  invariant(data, 'tx param missing: {data}');
  invariant(value, 'tx param missing: {value}');
  invariant(gasLimit, 'tx param missing: {gasLimit}');
  return {
    from,
    to,
    nonce,
    chainId,
    maxFeePerGas,
    maxPriorityFeePerGas,
    data,
    value,
    gasLimit,
  };
}

async function getPaymasterParams(
  incomingTransaction: IncomingTransaction,
  { gasPerPubdataByte }: { gasPerPubdataByte: string }
) {
  interface PaymasterParamsResponse {
    data: {
      eligible: boolean;
      paymasterParams: {
        paymaster: string;
        paymasterInput: string;
      };
      chargesData: {
        amount: number;
        deadline: string;
        eta: null;
      };
    };
    errors?: null | { title: string; detail: string }[];
  }
  type Request = {
    from: string;
    to: string;
    nonce: string;
    chainId: string;
    gas: string;
    gasPerPubdataByte: string;
    maxFee: string;
    maxPriorityFee: string;
    value: string;
    data: string;
  };
  const transaction = assertTransactionProps(incomingTransaction);
  const params: Request = {
    from: transaction.from,
    to: transaction.to,
    nonce: valueToHex(transaction.nonce),
    chainId: normalizeChainId(transaction.chainId),
    gas: valueToHex(transaction.gasLimit),
    gasPerPubdataByte,
    data: valueToHex(transaction.data),
    maxFee: valueToHex(transaction.maxFeePerGas),
    maxPriorityFee: valueToHex(transaction.maxPriorityFeePerGas),
    value: valueToHex(transaction.value),
  };
  const { data } = await ZerionAPI.get<PaymasterParamsResponse>(
    `/paymaster/get-params/v1?${new URLSearchParams({
      ...params,
      backend_env: 'zero',
    })}`
  );
  return data;
}

export async function fetchAndAssignPaymaster<T extends IncomingTransaction>(
  tx: T
) {
  const txCopy = { ...tx };
  const gas = getGas(txCopy);
  invariant(gas, 'Tx param missing: {gas}');
  const moreGas = ethers.BigNumber.from(gas).add(20000).toHexString();
  txCopy.gasLimit = moreGas;
  const gasPerPubdataByte = valueToHex(50000);
  const { eligible, paymasterParams } = await getPaymasterParams(txCopy, {
    gasPerPubdataByte,
  });
  if (eligible && paymasterParams) {
    txCopy.customData = { paymasterParams, gasPerPubdata: gasPerPubdataByte };
    return txCopy;
  } else {
    // NOTE: Maybe better to throw here? If paymaster endoint returns {eligible: false},
    // can it be an unexpected behavior to silently submit a transaction without a paymaster?
    return tx;
  }
}
