import type { ethers } from 'ethers';
import type { TypedData } from './TypedData';
import { prepareTypedData, removeUnusedTypes } from './prepareTypedData';

export async function signTypedData(
  rawTypedData: string | TypedData,
  signer: ethers.Wallet
) {
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
