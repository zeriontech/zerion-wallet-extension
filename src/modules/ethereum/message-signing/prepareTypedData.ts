import omit from 'lodash/omit';
import type { TypedData } from './TypedData';

function isTypedData(data: Partial<TypedData>): data is TypedData {
  return Boolean(data.domain && data.message && data.types);
}

function toTypedData(data: string | Partial<TypedData>): TypedData {
  if (typeof data === 'string') {
    try {
      const typedData = JSON.parse(data);
      return typedData as TypedData;
    } catch (e) {
      throw new Error('Failed to parse typedData input');
    }
  } else {
    if (!isTypedData(data)) {
      throw new Error('typedData input object is incomplete');
    } else {
      return data;
    }
  }
}

export function prepareTypedData(data: string | Partial<TypedData>): TypedData {
  const typedData = toTypedData(data);
  return {
    ...typedData,
    // We need to remove "EIP712Domain" property from the "types" object
    // because ethers computes it automatically and crashes if we leave it
    // https://github.com/ethers-io/ethers.js/issues/687#issuecomment-714069471
    types: omit(typedData.types, ['EIP712Domain']),
  };
}
