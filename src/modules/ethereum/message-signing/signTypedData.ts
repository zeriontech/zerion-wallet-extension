import type { ethers } from 'ethers';
import type { TypedData } from './TypedData';
import {
  assertTypedDataValues,
  prepareTypedData,
  removeUnusedTypes,
} from './prepareTypedData';

export async function signTypedData(
  rawTypedData: string | TypedData,
  signer: ethers.Wallet
) {
  // Defense in depth: eth_signTypedData_v4 rejects invalid values before
  // opening the dialog, but never let an internal caller sign a coerced value
  assertTypedDataValues(rawTypedData);
  const typedData = prepareTypedData(rawTypedData);

  // ethers throws error if typedData.types has unused types
  // however we can remove them and signed message will stay the same
  // so we can safely remove them
  const filteredTypes = removeUnusedTypes(
    typedData.types,
    typedData.primaryType
  );

  const signature = await signer.signTypedData(
    typedData.domain,
    filteredTypes,
    typedData.message
  );

  return signature;
}
