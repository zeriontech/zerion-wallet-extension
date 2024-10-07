import { ethers } from 'ethers';
import { invariant } from 'src/shared/invariant';
import { valueToHex } from 'src/shared/units/valueToHex';
import { normalizeChainId } from 'src/shared/normalizeChainId';
import type { ZerionApiClient } from 'src/modules/zerion-api/zerion-api-bare';
import { getGas } from '../transactions/getGas';
import type { IncomingTransaction } from '../types/IncomingTransaction';
import { GAS_PER_PUBDATA_BYTE_DEFAULT } from './constants';

type NetworksSource = 'mainnet' | 'testnet';

function adjustGas(value: ethers.BigNumberish): string {
  return ethers.BigNumber.from(value).add(50000).toHexString();
}

export function adjustedCheckEligibility(
  params: Parameters<ZerionApiClient['paymasterCheckEligibility']>[0],
  { source, apiClient }: { source: NetworksSource; apiClient: ZerionApiClient }
) {
  const txCopy = { ...params };
  const gas = getGas(txCopy);
  invariant(gas, 'Tx param missing: {gas}');
  const moreGas = adjustGas(gas);
  txCopy.gas = moreGas;
  return apiClient.paymasterCheckEligibility(txCopy, { source });
}

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
  {
    gasPerPubdataByte,
    source,
    apiClient,
  }: {
    gasPerPubdataByte: string;
    source: NetworksSource;
    apiClient: ZerionApiClient;
  }
) {
  const transaction = assertTransactionProps(incomingTransaction);
  type Request = Parameters<ZerionApiClient['getPaymasterParams']>[0];
  const params: Request = {
    transaction: {
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
    },
  };
  const { data } = await apiClient.getPaymasterParams(params, { source });
  return data;
}

export async function fetchAndAssignPaymaster<T extends IncomingTransaction>(
  tx: T,
  { source, apiClient }: { source: NetworksSource; apiClient: ZerionApiClient }
) {
  const txCopy = { ...tx };
  const gas = getGas(txCopy);
  invariant(gas, 'Tx param missing: {gas}');
  const moreGas = adjustGas(gas);
  txCopy.gasLimit = moreGas;
  const gasPerPubdataByte = GAS_PER_PUBDATA_BYTE_DEFAULT;
  const { eligible, paymasterParams } = await getPaymasterParams(txCopy, {
    gasPerPubdataByte,
    source,
    apiClient,
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
