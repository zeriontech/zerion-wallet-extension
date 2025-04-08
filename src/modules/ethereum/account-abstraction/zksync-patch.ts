import { ethers } from 'ethers';
import memoizeOne from 'memoize-one';
import type { Provider as ZksProvider } from 'zksync-ethers';
import {
  EIP712Signer,
  utils as zksUtils,
  types as zksTypes,
} from 'zksync-ethers';

/**
 * Patches runtime implementation of buggy `EIP712Signer.getSignInput`;
 * See: https://github.com/zksync-sdk/zksync-ethers/pull/228
 */
function patchEip712SignerGetSignInput() {
  EIP712Signer.getSignInput = (transaction: zksTypes.TransactionRequest) => {
    const maxFeePerGas = transaction.maxFeePerGas || transaction.gasPrice || 0n;
    const maxPriorityFeePerGas =
      transaction.maxPriorityFeePerGas ?? maxFeePerGas;
    const gasPerPubdataByteLimit =
      transaction.customData?.gasPerPubdata ||
      zksUtils.DEFAULT_GAS_PER_PUBDATA_LIMIT;
    return {
      txType: transaction.type || zksUtils.EIP712_TX_TYPE,
      from: transaction.from,
      to: transaction.to,
      gasLimit: transaction.gasLimit || 0n,
      gasPerPubdataByteLimit: gasPerPubdataByteLimit,
      maxFeePerGas,
      maxPriorityFeePerGas,
      paymaster:
        transaction.customData?.paymasterParams?.paymaster ||
        ethers.ZeroAddress,
      nonce: transaction.nonce || 0,
      value: transaction.value || 0n,
      data: transaction.data || '0x',
      factoryDeps:
        transaction.customData?.factoryDeps?.map((dep) =>
          zksUtils.hashBytecode(dep)
        ) || [],
      paymasterInput:
        transaction.customData?.paymasterParams?.paymasterInput || '0x',
    };
  };
}

const patchEip712SignerGetSignInputOnce = memoizeOne(
  patchEip712SignerGetSignInput
);

/** Patched implementation of zksync-ethers `parseEip712` */
export function parseEip712Patched(rawTx: string) {
  patchEip712SignerGetSignInputOnce();
  const incorrectResult = zksUtils.parseEip712(rawTx);
  delete incorrectResult.hash;
  if (Number(incorrectResult.maxPriorityFeePerGas) === 0) {
    incorrectResult.maxPriorityFeePerGas = '0'; // non-falsy zero hack
  }
  const hash = zksUtils.eip712TxHash(incorrectResult);
  return { ...incorrectResult, hash };
}

export function checkEip712Tx(serialized: string) {
  const payload = ethers.getBytes(serialized);
  return payload[0] === zksUtils.EIP712_TX_TYPE;
}

/**
 * Patched implementation of zksync-ethers `broadcastTransaction`:
 * https://github.com/zksync-sdk/zksync-ethers/blob/1e8231e304f3a0d37020f3083b4d63c94a27d80f/src/provider.ts#L982-L1002
 */
export async function broadcastTransactionPatched(
  provider: ZksProvider,
  signedTx: string
) {
  const { blockNumber, hash } = await ethers.resolveProperties({
    blockNumber: provider.getBlockNumber(),
    hash: provider._perform({
      method: 'broadcastTransaction',
      signedTransaction: signedTx,
    }),
    network: provider.getNetwork(),
  });

  const tx = zksTypes.Transaction.from(parseEip712Patched(signedTx));
  // eslint-disable-next-line security/detect-possible-timing-attacks -- Not a secret value
  if (tx.hash !== hash) {
    throw new Error('The returned hash did not match!');
  }

  return provider
    ._wrapTransactionResponse(tx)
    .replaceableTransaction(blockNumber);
}
