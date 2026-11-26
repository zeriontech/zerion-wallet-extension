import type { ChainId } from 'src/modules/ethereum/transactions/ChainId';
import { normalizeChainId } from 'src/shared/normalizeChainId';
import type { TypedData } from './TypedData';

/**
 * The EIP-712 SafeTx struct as Safe defines it. The order and the types are
 * part of the canonical shape: a SafeTx whose type differs would hash a
 * different payload, so it must not be treated as a Safe transaction.
 */
const SAFE_TX_FIELDS = [
  { name: 'to', type: 'address' },
  { name: 'value', type: 'uint256' },
  { name: 'data', type: 'bytes' },
  { name: 'operation', type: 'uint8' },
  { name: 'safeTxGas', type: 'uint256' },
  { name: 'baseGas', type: 'uint256' },
  { name: 'gasPrice', type: 'uint256' },
  { name: 'gasToken', type: 'address' },
  { name: 'refundReceiver', type: 'address' },
  { name: 'nonce', type: 'uint256' },
] as const;

const SAFE_TX_DOMAIN_KEYS = ['chainId', 'verifyingContract'] as const;

const EIP712_DOMAIN_FIELDS = [
  { name: 'chainId', type: 'uint256' },
  { name: 'verifyingContract', type: 'address' },
] as const;

const ADDRESS_PATTERN = /^0x[0-9a-fA-F]{40}$/;
const HEX_BYTES_PATTERN = /^0x[0-9a-fA-F]*$/;
const HEX_QUANTITY_PATTERN = /^0x[0-9a-fA-F]+$/;
const DECIMAL_QUANTITY_PATTERN = /^\d+$/;

const UINT_QUANTITY_FIELDS = ['value', 'safeTxGas', 'baseGas', 'gasPrice', 'nonce'] as const;

function isAddress(value: unknown): boolean {
  return typeof value === 'string' && ADDRESS_PATTERN.test(value);
}

function hasExactlyKeys(value: object, expectedKeys: readonly string[]): boolean {
  const keys = Object.keys(value);
  return (
    keys.length === expectedKeys.length &&
    expectedKeys.every((key) => Object.prototype.hasOwnProperty.call(value, key))
  );
}

function matchesFields(
  actual: unknown,
  expected: readonly { name: string; type: string }[],
): boolean {
  if (!Array.isArray(actual) || actual.length !== expected.length) {
    return false;
  }
  return expected.every((field, index) => {
    const item: unknown = actual[index];
    if (
      !item ||
      typeof item !== 'object' ||
      !('name' in item) ||
      !('type' in item) ||
      !hasExactlyKeys(item, ['name', 'type'])
    ) {
      return false;
    }
    return item.name === field.name && item.type === field.type;
  });
}

/**
 * Reads a uint the way app.safe.global and other Safe tooling encode it:
 * a number, a decimal string or a 0x hex string, including zero-padded hex.
 * This is a deliberate divergence from the web decoder, which requires a
 * positive safe-integer number and would reject `'1'`, `'0x1'` and `'0x01'`.
 * The extension must accept what dapps actually send.
 */
export function parseSafeTxQuantity(value: unknown): bigint | null {
  if (typeof value === 'number') {
    return Number.isSafeInteger(value) && value >= 0 ? BigInt(value) : null;
  }
  if (typeof value === 'bigint') {
    return value >= 0n ? value : null;
  }
  if (typeof value !== 'string') {
    return null;
  }
  const trimmed = value.trim();
  if (!HEX_QUANTITY_PATTERN.test(trimmed) && !DECIMAL_QUANTITY_PATTERN.test(trimmed)) {
    return null;
  }
  try {
    return BigInt(trimmed);
  } catch {
    return null;
  }
}

/**
 * Canonicalizes a SafeTx domain chain id to this repo's chain-collection key
 * (`0x1`). Chain id encoding is deliberately tolerant: `1`, `'1'`, `'0x1'` and
 * `'0x01'` all resolve to the same chain. The signed payload is never changed.
 */
export function parseSafeTxChainId(value: unknown): ChainId | null {
  const numeric = parseSafeTxQuantity(value);
  if (numeric == null || numeric <= 0n) {
    return null;
  }
  try {
    return normalizeChainId(numeric.toString(10));
  } catch {
    // Malformed values must keep the preview on the origin chain, never throw.
    return null;
  }
}

/**
 * Whether the typed data is the canonical SafeTx payload Safe wallets sign:
 * `primaryType` is `SafeTx`; the domain carries exactly a positive `chainId`
 * and an address `verifyingContract`; the `SafeTx` type is the 10 Safe fields
 * in order with their documented types; `EIP712Domain`, when present, is the
 * canonical pair; and the message has exactly the ten fields with their Safe
 * value shapes. Anything else is a lookalike and keeps the dapp's chain.
 *
 * Encoding tolerance is limited to the chain id and the uint quantities,
 * which may be numbers, decimal strings or 0x hex strings including zero
 * padding. This is a deliberate divergence from the web decoder, which
 * requires positive safe-integer numbers and would reject what dapps send.
 */
export function isCanonicalSafeTx(typedData: TypedData): boolean {
  if (typedData.primaryType !== 'SafeTx') {
    return false;
  }

  const domain = typedData.domain;
  if (
    !domain ||
    typeof domain !== 'object' ||
    !hasExactlyKeys(domain, SAFE_TX_DOMAIN_KEYS) ||
    !isAddress(domain.verifyingContract) ||
    parseSafeTxChainId(domain.chainId) == null
  ) {
    return false;
  }

  const types = typedData.types;
  if (!types || typeof types !== 'object' || !matchesFields(types.SafeTx, SAFE_TX_FIELDS)) {
    return false;
  }
  if (
    types.EIP712Domain !== undefined &&
    !matchesFields(types.EIP712Domain, EIP712_DOMAIN_FIELDS)
  ) {
    return false;
  }

  const message = typedData.message;
  if (
    !message ||
    typeof message !== 'object' ||
    !hasExactlyKeys(
      message,
      SAFE_TX_FIELDS.map((field) => field.name),
    )
  ) {
    return false;
  }

  const fields: Record<string, unknown> = message;
  return (
    isAddress(fields.to) &&
    isAddress(fields.gasToken) &&
    isAddress(fields.refundReceiver) &&
    typeof fields.data === 'string' &&
    fields.data.length % 2 === 0 &&
    HEX_BYTES_PATTERN.test(fields.data) &&
    (fields.operation === 0 || fields.operation === 1) &&
    UINT_QUANTITY_FIELDS.every((name) => parseSafeTxQuantity(fields[name]) != null)
  );
}
