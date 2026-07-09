import omit from 'lodash/omit';
import type { TypedData } from './TypedData';

function isTypedData(data: Partial<TypedData>): data is TypedData {
  return Boolean(data.domain && data.message && data.types);
}

export function isPermit({ message }: TypedData) {
  return Boolean(message.spender);
}

export function toTypedData(data: string | Partial<TypedData>): TypedData {
  if (typeof data === 'string') {
    try {
      const typedData = JSON.parse(data) as TypedData;
      return typedData;
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

/**
 * A whitespace-padded domain chainId (e.g. " 1") is tolerated during signing
 * (ethers coerces it with BigInt, which trims whitespace), but breaks the
 * interpretation backend. Sanitize it so interpretation runs on the same
 * value that gets signed. Well-formed payloads are returned unchanged.
 */
export function sanitizeTypedData(typedData: TypedData): TypedData {
  const { chainId } = typedData.domain;
  if (typeof chainId === 'string' && chainId.trim() !== chainId) {
    return {
      ...typedData,
      domain: { ...typedData.domain, chainId: chainId.trim() },
    };
  }
  return typedData;
}

export function sanitizeTypedDataRaw(
  data: string | Partial<TypedData>
): string {
  try {
    return JSON.stringify(sanitizeTypedData(toTypedData(data)));
  } catch {
    // Malformed payloads pass through unchanged so that downstream
    // validation reports the error to the user as before
    return typeof data === 'string' ? data : JSON.stringify(data);
  }
}

const ESCAPE_ARRAY_SYMBOLS_PATTERN = /^([^\x5b]*)(\x5b|$)/;

// based on https://github.com/ethers-io/ethers.js/blob/13593809bd61ef24c01d79de82563540d77098db/src.ts/hash/typed-data.ts#L210
export function removeUnusedTypes(
  types: TypedData['types'],
  primaryType: TypedData['primaryType']
): TypedData['types'] {
  const parents = new Map<string, string[]>(
    Object.keys(types).map((key) => [key, []])
  );
  for (const name in types) {
    for (const field of types[name]) {
      const baseType =
        field.type.match(ESCAPE_ARRAY_SYMBOLS_PATTERN)?.[1] || null;
      if (baseType) {
        parents.get(baseType)?.push(name);
      }
    }
  }
  const unusedTypes = Array.from(parents.keys()).filter(
    (type) => parents.get(type)?.length === 0 && type !== primaryType
  );
  return omit(types, unusedTypes);
}
