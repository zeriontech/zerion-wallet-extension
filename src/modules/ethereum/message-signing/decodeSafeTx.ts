import { TypedDataEncoder } from 'ethers';
import { isObj } from 'src/shared/isObj';
import { isCanonicalSafeTx, parseSafeTxQuantity } from './canonicalSafeTx';
import type { TypedData } from './TypedData';

/**
 * A decoded call inside a SafeTx. Operation 0 (CALL) is classified from its
 * calldata; operation 1 (DELEGATECALL) inside a MultiSend batch is flagged as
 * `inner-delegatecall`; everything that cannot be decoded is one
 * `not-decoded` row carrying the raw call.
 */
export type SafeTxCall = {
  to: string;
  value: bigint;
  data: `0x${string}`;
  operation: number;
  kind: 'native' | 'erc20-transfer' | 'contract-call' | 'inner-delegatecall' | 'not-decoded';
  recipient?: string;
  amount?: bigint;
};

export type DecodedSafeTx = {
  safe: string;
  chainId: number;
  nonce: bigint;
  operation: 0 | 1;
  /** Operation 0: exactly one call. Operation 1: the inner calls, or one `not-decoded` row. */
  calls: SafeTxCall[];
  batch: null | {
    target: string;
    knownMultiSendCallOnly: boolean;
    decoded: boolean;
  };
  refund: null | {
    safeTxGas: bigint;
    baseGas: bigint;
    gasPrice: bigint;
    gasToken: string;
    refundReceiver: string;
  };
  hashes: {
    safeTxHash: string;
    domainHash: string;
    messageHash: string;
  };
};

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

/** MultiSendCallOnly deployments the CLI accepts (safe-deployments 1.37.x). */
export const MULTISEND_CALL_ONLY_ADDRESSES = [
  '0x40A2aCCbd92BCA938b02010E17A5b8929b49130D', // 1.3.0 canonical
  '0xA1dabEF33b3B82c7814B6D82A79e50F4AC44102B', // 1.3.0 eip155
  '0xf220D3b4DFb23C4ade8C88E526C1353AbAcbC38F', // 1.3.0 zksync
  '0x9641d764fc13c8B624c04430C7356C1C7C8102e2', // 1.4.1 canonical
  '0x0408EF011960d02349d50286D20531229BCef773', // 1.4.1 zksync
  '0xA83c336B20401Af773B6219BA5027174338D1836', // 1.5.0 canonical
] as const;

const MULTISEND_SELECTOR = '8d80ff0a';
const ERC20_TRANSFER_SELECTOR = 'a9059cbb';

const UINT_MESSAGE_FIELDS: Record<string, true> = {
  value: true,
  safeTxGas: true,
  baseGas: true,
  gasPrice: true,
  nonce: true,
};

/** Operation 0 rules, shared by top-level calls and calls inside a batch. */
function classifyCall({
  to,
  value,
  data,
  operation,
}: {
  to: string;
  value: bigint;
  data: `0x${string}`;
  operation: number;
}): SafeTxCall {
  if (operation !== 0) {
    return { to, value, data, operation, kind: 'inner-delegatecall' };
  }
  if (data === '0x') {
    return { to, value, data, operation, kind: 'native' };
  }
  const payload = data.slice(2).toLowerCase();
  // Exactly transfer(address,uint256): selector + two 32-byte words.
  if (payload.length === 8 + 64 + 64 && payload.startsWith(ERC20_TRANSFER_SELECTOR)) {
    return {
      to,
      value,
      data,
      operation,
      kind: 'erc20-transfer',
      recipient: `0x${payload.slice(8 + 24, 8 + 64)}`,
      amount: BigInt(`0x${payload.slice(8 + 64, 8 + 128)}`),
    };
  }
  return { to, value, data, operation, kind: 'contract-call' };
}

/**
 * Unpack a `multiSend(bytes)` calldata blob into its inner calls. Returns
 * `null` for anything that is not exactly the ABI-encoded bytes argument with
 * complete packed `op(1) to(20) value(32) len(32) data` entries — the caller
 * shows one "Batch, not decoded" row instead of guessing.
 */
function decodeMultiSendData(data: `0x${string}`): SafeTxCall[] | null {
  const hex = data.slice(2).toLowerCase();
  if (!hex.startsWith(MULTISEND_SELECTOR)) {
    return null;
  }
  const body = hex.slice(MULTISEND_SELECTOR.length);
  if (body.length < 128) {
    return null;
  }
  // ABI head: bytes offset then length. The CLI's encoder emits offset 32.
  if (BigInt(`0x${body.slice(0, 64)}`) !== 32n) {
    return null;
  }
  const byteLength = BigInt(`0x${body.slice(64, 128)}`);
  const payloadStart = 128;
  if (byteLength > BigInt((body.length - payloadStart) / 2)) {
    return null;
  }
  const payload = body.slice(payloadStart, payloadStart + Number(byteLength) * 2);

  const calls: SafeTxCall[] = [];
  let cursor = 0;
  while (cursor < payload.length) {
    // op + to + value + data length, then the data itself
    if (payload.length - cursor < 2 + 40 + 64 + 64) {
      return null;
    }
    const operation = Number.parseInt(payload.slice(cursor, cursor + 2), 16);
    cursor += 2;
    const to = `0x${payload.slice(cursor, cursor + 40)}`;
    cursor += 40;
    const value = BigInt(`0x${payload.slice(cursor, cursor + 64)}`);
    cursor += 64;
    const dataLength = BigInt(`0x${payload.slice(cursor, cursor + 64)}`);
    cursor += 64;
    if (dataLength > BigInt((payload.length - cursor) / 2)) {
      return null;
    }
    const callData = `0x${payload.slice(cursor, cursor + Number(dataLength) * 2)}` as `0x${string}`;
    cursor += Number(dataLength) * 2;
    calls.push(classifyCall({ to, value, data: callData, operation }));
  }
  return calls;
}

/**
 * The ticket's exact recipe: `EIP712Domain` is not part of the hashed types.
 * Numeric values are normalized to bigints first, so tolerant input encodings
 * (decimal strings, 0x hex including zero padding) hash exactly like the
 * canonical web payload.
 */
function hashSafeTx({
  domain,
  types,
  message,
}: {
  domain: { chainId: number; verifyingContract: string };
  types: Record<string, ReadonlyArray<{ name: string; type: string }>>;
  message: Record<string, unknown>;
}) {
  const hashedTypes: Record<string, Array<{ name: string; type: string }>> = {};
  for (const [name, fields] of Object.entries(types)) {
    if (name !== 'EIP712Domain') {
      hashedTypes[name] = fields.map((field) => ({
        name: field.name,
        type: field.type,
      }));
    }
  }
  return {
    safeTxHash: TypedDataEncoder.hash(domain, hashedTypes, message),
    domainHash: TypedDataEncoder.hashDomain(domain),
    messageHash: TypedDataEncoder.from(hashedTypes).hash(message),
  };
}

/**
 * Decode a canonical SafeTx typed-data object — or return `null` for anything
 * else. Canonicality is the shared `isCanonicalSafeTx` predicate from the
 * preview-chain layer: primaryType `SafeTx`, a domain with exactly `chainId`
 * and `verifyingContract`, the pinned ten-field `SafeTx` type list in order,
 * and message values of the pinned shapes. A renamed, retyped or reordered
 * field is a different EIP-712 request, so it is not rendered as this one.
 *
 * Unlike the web decoder, the shared predicate and `parseSafeTxQuantity`
 * accept number, decimal-string and 0x-hex (including zero-padded) encodings
 * for the chain id and message uints. The hashes are computed from those
 * normalized integers, so the pinned vectors still reproduce exactly.
 *
 * The decode is pure: it never reads the simulation, CLI-supplied context or
 * the network. The hashes are exactly what a Ledger shows for this payload.
 */
export function decodeSafeTx(typedData: unknown): DecodedSafeTx | null {
  if (!isObj(typedData)) {
    return null;
  }
  const candidate = typedData as unknown as TypedData;
  if (!isCanonicalSafeTx(candidate)) {
    return null;
  }
  const domain = candidate.domain;
  const types = candidate.types;
  const message = candidate.message;

  const chainIdValue = parseSafeTxQuantity(domain.chainId);
  if (
    chainIdValue === null ||
    chainIdValue <= 0n ||
    chainIdValue > BigInt(Number.MAX_SAFE_INTEGER)
  ) {
    return null;
  }
  const chainId = Number(chainIdValue);
  const verifyingContract = domain.verifyingContract;
  if (typeof verifyingContract !== 'string') {
    return null;
  }

  const normalizedMessage: Record<string, unknown> = {};
  for (const [name, value] of Object.entries(message)) {
    if (UINT_MESSAGE_FIELDS[name]) {
      const parsed = parseSafeTxQuantity(value);
      if (parsed === null) {
        return null;
      }
      normalizedMessage[name] = parsed;
    } else {
      normalizedMessage[name] = value;
    }
  }

  const to = message.to as string;
  const data = message.data as `0x${string}`;
  const operation = message.operation as 0 | 1;
  const value = normalizedMessage.value as bigint;
  const safeTxGas = normalizedMessage.safeTxGas as bigint;
  const baseGas = normalizedMessage.baseGas as bigint;
  const gasPrice = normalizedMessage.gasPrice as bigint;
  const nonce = normalizedMessage.nonce as bigint;
  const gasToken = message.gasToken as string;
  const refundReceiver = message.refundReceiver as string;

  let hashes: DecodedSafeTx['hashes'];
  try {
    hashes = hashSafeTx({
      domain: { chainId, verifyingContract },
      types,
      message: normalizedMessage,
    });
  } catch {
    // Anything ethers refuses to encode is not canonical either
    return null;
  }

  const refund =
    safeTxGas !== 0n ||
    baseGas !== 0n ||
    gasPrice !== 0n ||
    gasToken.toLowerCase() !== ZERO_ADDRESS ||
    refundReceiver.toLowerCase() !== ZERO_ADDRESS
      ? { safeTxGas, baseGas, gasPrice, gasToken, refundReceiver }
      : null;

  if (operation === 0) {
    return {
      safe: verifyingContract,
      chainId,
      nonce,
      operation,
      calls: [classifyCall({ to, value, data, operation })],
      batch: null,
      refund,
      hashes,
    };
  }

  const knownMultiSendCallOnly = MULTISEND_CALL_ONLY_ADDRESSES.some(
    (address) => address.toLowerCase() === to.toLowerCase(),
  );
  const innerCalls = knownMultiSendCallOnly && value === 0n ? decodeMultiSendData(data) : null;
  if (!innerCalls) {
    return {
      safe: verifyingContract,
      chainId,
      nonce,
      operation,
      calls: [{ to, value, data, operation: 1, kind: 'not-decoded' }],
      batch: { target: to, knownMultiSendCallOnly, decoded: false },
      refund,
      hashes,
    };
  }
  return {
    safe: verifyingContract,
    chainId,
    nonce,
    operation,
    calls: innerCalls,
    batch: { target: to, knownMultiSendCallOnly, decoded: true },
    refund,
    hashes,
  };
}
