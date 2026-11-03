import type { TypedDataDocument } from 'src/shared/types/Quote';
import type { IntentEVM } from 'src/modules/zerion-api/requests/wallet-prepare-permits';
import type { TypedData } from './TypedData';

type DomainField = keyof TypedDataDocument['domain'];

/** Canonical EIP-712 domain field order with each field's type */
const DOMAIN_FIELD_TYPES: Array<{ name: DomainField; type: string }> = [
  { name: 'name', type: 'string' },
  { name: 'version', type: 'string' },
  { name: 'chainId', type: 'uint256' },
  { name: 'verifyingContract', type: 'address' },
  { name: 'salt', type: 'bytes32' },
];

/**
 * Shapes an API EIP-712 document for `signTypedData_v4`: a parsed `message`,
 * only the set domain fields with a numeric `chainId`, and an `EIP712Domain`
 * listing exactly those fields.
 */
export function prepareTypedDataForSigning(
  document: TypedDataDocument | IntentEVM
): TypedData {
  const message =
    typeof document.message === 'string'
      ? (JSON.parse(document.message) as Record<string, unknown>)
      : document.message;

  const domain: Record<string, string | number> = {};
  for (const { name } of DOMAIN_FIELD_TYPES) {
    const value = document.domain[name];
    if (value == null) {
      continue;
    }
    domain[name] = name === 'chainId' ? Number(value) : value;
  }

  const types = document.types.EIP712Domain
    ? document.types
    : {
        EIP712Domain: DOMAIN_FIELD_TYPES.filter(
          ({ name }) => name in domain
        ).map(({ name, type }) => ({ name, type })),
        ...document.types,
      };

  return { domain, types, primaryType: document.primaryType, message };
}
