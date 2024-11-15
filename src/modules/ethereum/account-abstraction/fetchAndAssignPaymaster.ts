import { ethers } from 'ethers';
import { invariant } from 'src/shared/invariant';
import { valueToHex } from 'src/shared/units/valueToHex';
import { normalizeChainId } from 'src/shared/normalizeChainId';
import type { ZerionApiClient } from 'src/modules/zerion-api/zerion-api-bare';
import { assertProp } from 'src/shared/assert-property';
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

function normalizeTransactionProps(tx: IncomingTransaction) {
  const gasLimit = getGas(tx);
  invariant(gasLimit, 'tx param missing: {gasLimit}');
  assertProp(tx, 'from');
  assertProp(tx, 'to');
  assertProp(tx, 'nonce');
  assertProp(tx, 'chainId');
  assertProp(tx, 'maxFeePerGas');
  assertProp(tx, 'maxPriorityFeePerGas');
  return {
    from: tx.from,
    to: tx.to,
    nonce: tx.nonce,
    chainId: tx.chainId,
    maxFeePerGas: tx.maxFeePerGas,
    maxPriorityFeePerGas: tx.maxPriorityFeePerGas,
    data: tx.data,
    value: tx.value,
    gas: gasLimit,
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
  console.log({ incomingTransaction });
  const transaction = normalizeTransactionProps(incomingTransaction);
  type Request = Parameters<ZerionApiClient['getPaymasterParams']>[0];
  const params: Request = {
    transaction: {
      from: transaction.from,
      to: transaction.to,
      nonce: valueToHex(transaction.nonce),
      chainId: normalizeChainId(transaction.chainId),
      gas: valueToHex(transaction.gas),
      gasPerPubdataByte,
      data: valueToHex(transaction.data ?? '0x0'),
      maxFee: valueToHex(transaction.maxFeePerGas),
      maxPriorityFee: valueToHex(transaction.maxPriorityFeePerGas),
      value: valueToHex(transaction.value ?? '0x0'),
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
