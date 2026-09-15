import type { IntentEVM } from 'src/modules/zerion-api/requests/wallet-prepare-permits';
import type { TypedData } from 'src/modules/ethereum/message-signing/TypedData';

const DOMAIN_FIELD_TYPES: Record<keyof IntentEVM['domain'], string> = {
  name: 'string',
  version: 'string',
  chainId: 'uint256',
  verifyingContract: 'address',
  salt: 'bytes32',
};
// EIP-712 canonical order of the domain fields
const DOMAIN_FIELD_ORDER: (keyof IntentEVM['domain'])[] = [
  'name',
  'version',
  'chainId',
  'verifyingContract',
  'salt',
];

/**
 * Backend permits arrive with a nullable EIP-712 domain; signers expect only
 * the fields that are set, and `signTypedData_v4` wants an `EIP712Domain`
 * type matching them. The rest of the payload is signed as-is.
 */
export function toTypedData(intent: IntentEVM): TypedData {
  const domain: Record<string, string | number> = {};
  for (const field of DOMAIN_FIELD_ORDER) {
    const value = intent.domain[field];
    if (value == null) {
      continue;
    }
    domain[field] = field === 'chainId' ? Number(value) : value;
  }
  const types = intent.types.EIP712Domain
    ? intent.types
    : {
        EIP712Domain: DOMAIN_FIELD_ORDER.filter((field) => field in domain).map(
          (field) => ({ name: field, type: DOMAIN_FIELD_TYPES[field] })
        ),
        ...intent.types,
      };
  return {
    domain,
    types,
    primaryType: intent.primaryType,
    message: intent.message,
  };
}
