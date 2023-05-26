import { ethers } from 'ethers';
import produce from 'immer';
import omit from 'lodash/omit';
import type { Networks } from 'src/modules/networks/Networks';
import { sendRpcRequest } from 'src/shared/custom-rpc/rpc-request';
import { invariant } from 'src/shared/invariant';
import type { IncomingTransaction } from '../types/IncomingTransaction';
import { getGas } from './getGas';

function resolveChainId(transaction: IncomingTransaction) {
  const { chainId: incomingChainId } = transaction;
  invariant(incomingChainId, 'Transaction object must have a chainId property');
  return ethers.utils.hexValue(incomingChainId);
}

function add10Percent(value: number) {
  return Math.round(value * 1.1); // result must be an integer
}

async function estimateGas(
  transaction: IncomingTransaction,
  networks: Networks
) {
  const chainId = resolveChainId(transaction);
  const rpcUrl = networks.getRpcUrlInternal(networks.getChainById(chainId));
  const { result } = await sendRpcRequest<string>(rpcUrl, {
    method: 'eth_estimateGas',
    params: [
      omit(transaction, [
        'gas', // error on Aurora if gas: 0x0, so we omit it
        'nonce', // error on Polygon if nonce is int, but we don't need it at all
      ]),
    ],
  });
  return add10Percent(parseInt(result));
}

function hasGasEstimation(transaction: IncomingTransaction) {
  const gas = getGas(transaction);
  return gas && !ethers.BigNumber.from(gas).isZero();
}

/**
 * This method checks if gas and network-fee related fields are present,
 * and if necessary, makes eth_estimateGas and eth_gasPrice calls and
 * applies the results to the transaction
 */
export async function prepareGas<T extends IncomingTransaction>(
  transaction: T,
  networks: Networks
) {
  const gas = await (hasGasEstimation(transaction)
    ? null
    : estimateGas(transaction, networks));
  return produce(transaction, (draft) => {
    if (gas) {
      delete draft.gas;
      draft.gasLimit = gas;
    }
  });
}
