import type { TypedData } from './TypedData';
import {
  BASE_DOMAIN_HASH,
  BASE_MESSAGE_HASH,
  BASE_SAFE,
  BASE_SAFE_TX_HASH,
  BASE_TRANSFER_AMOUNT,
  BASE_TRANSFER_RECIPIENT,
  BASE_TYPED_DATA,
  BASE_USDC,
  ETHEREUM_MULTISEND_CALL_ONLY,
  ETHEREUM_MULTISEND_TYPED_DATA,
  ETHEREUM_SAFE,
  ETHEREUM_SAFE_TX_HASH,
} from './safeTxFixtures';
import { MULTISEND_CALL_ONLY_ADDRESSES, decodeSafeTx } from './decodeSafeTx';

/**
 * A deliberately corruptible view of the canonical fixture: the rejection
 * tests mutate one field at a time into shapes `TypedData` cannot express.
 */
type MutableSafeTxTypedData = {
  domain: Record<string, unknown>;
  types: Record<string, Array<{ name: string; type: string }>>;
  primaryType: unknown;
  message: Record<string, unknown>;
};

function mutableSafeTx(): MutableSafeTxTypedData {
  return structuredClone(BASE_TYPED_DATA) as MutableSafeTxTypedData;
}

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
const RECIPIENT = '0x1111111111111111111111111111111111111111';
const NATIVE_TARGET = '0x2222222222222222222222222222222222222222';
const UNKNOWN_DELEGATE_TARGET = '0x3333333333333333333333333333333333333333';

function typedData(overrides: {
  to?: string;
  value?: string;
  data?: string;
  operation?: number;
  safeTxGas?: string;
  baseGas?: string;
  gasPrice?: string;
  gasToken?: string;
  refundReceiver?: string;
  nonce?: string;
}): TypedData {
  return {
    domain: { chainId: 8453, verifyingContract: BASE_SAFE },
    types: structuredClone(BASE_TYPED_DATA.types),
    primaryType: 'SafeTx',
    message: {
      to: overrides.to ?? BASE_USDC,
      value: overrides.value ?? '0',
      data: overrides.data ?? '0x',
      operation: overrides.operation ?? 0,
      safeTxGas: overrides.safeTxGas ?? '0',
      baseGas: overrides.baseGas ?? '0',
      gasPrice: overrides.gasPrice ?? '0',
      gasToken: overrides.gasToken ?? ZERO_ADDRESS,
      refundReceiver: overrides.refundReceiver ?? ZERO_ADDRESS,
      nonce: overrides.nonce ?? '1',
    },
  };
}

type PackedCall = {
  operation: number;
  to: string;
  value: bigint;
  data: string;
};

/** ABI-encode `multiSend(bytes)` over packed `op(1) to(20) value(32) len(32) data` entries. */
function encodeMultiSend(calls: PackedCall[]): string {
  const packed = calls
    .map(({ operation, to, value, data }) => {
      const hexData = data.slice(2);
      return [
        operation.toString(16).padStart(2, '0'),
        to.slice(2).toLowerCase().padStart(40, '0'),
        value.toString(16).padStart(64, '0'),
        (hexData.length / 2).toString(16).padStart(64, '0'),
        hexData,
      ].join('');
    })
    .join('');
  const offset = (32).toString(16).padStart(64, '0');
  const length = (packed.length / 2).toString(16).padStart(64, '0');
  return `0x8d80ff0a${offset}${length}${packed}`;
}

function erc20Transfer(recipient: string, amount: bigint): string {
  return `0xa9059cbb${recipient
    .slice(2)
    .toLowerCase()
    .padStart(64, '0')}${amount.toString(16).padStart(64, '0')}`;
}

describe('decodeSafeTx canonical decode', () => {
  it('decodes the base operation-0 fixture and its pinned hashes', () => {
    const decoded = decodeSafeTx(BASE_TYPED_DATA);

    expect(decoded).not.toBeNull();
    expect(decoded?.safe).toBe(BASE_SAFE);
    expect(decoded?.chainId).toBe(8453);
    expect(decoded?.nonce).toBe(78n);
    expect(decoded?.operation).toBe(0);
    expect(decoded?.batch).toBeNull();
    expect(decoded?.refund).toBeNull();
    expect(decoded?.calls).toHaveLength(1);
    expect(decoded?.calls[0]).toMatchObject({
      to: BASE_USDC,
      value: 0n,
      kind: 'erc20-transfer',
      recipient: BASE_TRANSFER_RECIPIENT,
      amount: BASE_TRANSFER_AMOUNT,
    });
    expect(decoded?.hashes).toEqual({
      safeTxHash: BASE_SAFE_TX_HASH,
      domainHash: BASE_DOMAIN_HASH,
      messageHash: BASE_MESSAGE_HASH,
    });
  });

  it('decodes the ethereum MultiSend fixture to exactly its two inner calls', () => {
    const decoded = decodeSafeTx(ETHEREUM_MULTISEND_TYPED_DATA);

    expect(decoded).not.toBeNull();
    expect(decoded?.safe).toBe(ETHEREUM_SAFE);
    expect(decoded?.chainId).toBe(1);
    expect(decoded?.nonce).toBe(3519n);
    expect(decoded?.operation).toBe(1);
    expect(decoded?.batch).toEqual({
      target: ETHEREUM_MULTISEND_CALL_ONLY,
      knownMultiSendCallOnly: true,
      decoded: true,
    });
    expect(decoded?.calls.map((call) => call.to)).toEqual([
      '0x0dc4f92879b7670e5f4e4e6e3c801d229129d90d',
      '0xf80eeec09f417fa7fcc4a848ef03af9df2658d7b',
    ]);
    expect(decoded?.calls.map((call) => call.kind)).toEqual(['contract-call', 'contract-call']);
    expect(decoded?.calls.map((call) => call.operation)).toEqual([0, 0]);
    expect(decoded?.calls[0].data.startsWith('0x095ea7b3')).toBe(true);
    expect(decoded?.calls[1].data.startsWith('0x2608f818')).toBe(true);
    expect(decoded?.hashes.safeTxHash).toBe(ETHEREUM_SAFE_TX_HASH);
  });

  it('keeps the pinned hashes for tolerant chain-id and uint encodings', () => {
    const decimalChainId = decodeSafeTx({
      ...structuredClone(BASE_TYPED_DATA),
      domain: { chainId: '8453', verifyingContract: BASE_SAFE },
    });
    expect(decimalChainId?.hashes).toEqual({
      safeTxHash: BASE_SAFE_TX_HASH,
      domainHash: BASE_DOMAIN_HASH,
      messageHash: BASE_MESSAGE_HASH,
    });

    const paddedHexChainId = decodeSafeTx({
      ...structuredClone(BASE_TYPED_DATA),
      domain: { chainId: '0x002105', verifyingContract: BASE_SAFE },
    });
    expect(paddedHexChainId?.chainId).toBe(8453);
    expect(paddedHexChainId?.hashes).toEqual({
      safeTxHash: BASE_SAFE_TX_HASH,
      domainHash: BASE_DOMAIN_HASH,
      messageHash: BASE_MESSAGE_HASH,
    });

    const hexUints = structuredClone(BASE_TYPED_DATA);
    hexUints.message = {
      ...hexUints.message,
      value: '0x0',
      nonce: '0x4e',
      safeTxGas: '0x00',
    };
    expect(decodeSafeTx(hexUints)?.hashes).toEqual({
      safeTxHash: BASE_SAFE_TX_HASH,
      domainHash: BASE_DOMAIN_HASH,
      messageHash: BASE_MESSAGE_HASH,
    });
  });
});

describe('decodeSafeTx rejects non-canonical input', () => {
  it('rejects anything without a canonical SafeTx primaryType', () => {
    const missing = mutableSafeTx();
    delete missing.primaryType;
    expect(decodeSafeTx(missing)).toBeNull();

    for (const primaryType of ['SafeTxX', 'safeTx', '', 42, null]) {
      const candidate = mutableSafeTx();
      candidate.primaryType = primaryType;
      expect(decodeSafeTx(candidate)).toBeNull();
    }
    for (const candidate of [null, undefined, 'SafeTx', 42, []]) {
      expect(decodeSafeTx(candidate)).toBeNull();
    }
  });

  it('rejects an extra or missing domain field and a missing verifyingContract', () => {
    const extra = mutableSafeTx();
    extra.domain.name = 'Safe';
    expect(decodeSafeTx(extra)).toBeNull();

    const missingContract = mutableSafeTx();
    delete missingContract.domain.verifyingContract;
    expect(decodeSafeTx(missingContract)).toBeNull();

    const missingChainId = mutableSafeTx();
    delete missingChainId.domain.chainId;
    expect(decodeSafeTx(missingChainId)).toBeNull();

    const zeroChainId = mutableSafeTx();
    zeroChainId.domain.chainId = 0;
    expect(decodeSafeTx(zeroChainId)).toBeNull();
  });

  const safeTxFieldNames = [
    'to',
    'value',
    'data',
    'operation',
    'safeTxGas',
    'baseGas',
    'gasPrice',
    'gasToken',
    'refundReceiver',
    'nonce',
  ] as const;

  it('rejects every renamed SafeTx field', () => {
    for (const fieldName of safeTxFieldNames) {
      const candidate = mutableSafeTx();
      const field = candidate.types.SafeTx.find((entry) => entry.name === fieldName);
      expect(field).toBeDefined();
      field!.name = `${fieldName}Renamed`;
      expect(decodeSafeTx(candidate)).toBeNull();
    }
  });

  it('rejects every retyped SafeTx field', () => {
    for (const fieldName of safeTxFieldNames) {
      const candidate = mutableSafeTx();
      const field = candidate.types.SafeTx.find((entry) => entry.name === fieldName);
      expect(field).toBeDefined();
      field!.type = field!.type === 'address' ? 'bytes32' : 'address';
      expect(decodeSafeTx(candidate)).toBeNull();
    }
  });

  it('rejects every SafeTx field reordering', () => {
    for (let index = 0; index < safeTxFieldNames.length - 1; index += 1) {
      const candidate = mutableSafeTx();
      const fields = candidate.types.SafeTx;
      [fields[index], fields[index + 1]] = [fields[index + 1], fields[index]];
      expect(decodeSafeTx(candidate)).toBeNull();
    }
  });

  it('rejects a renamed message field, extra keys and invalid values', () => {
    for (const fieldName of safeTxFieldNames) {
      const candidate = mutableSafeTx();
      candidate.message[`${fieldName}Renamed`] = candidate.message[fieldName];
      delete candidate.message[fieldName];
      expect(decodeSafeTx(candidate)).toBeNull();
    }

    const extra = mutableSafeTx();
    extra.message.extra = '1';
    expect(decodeSafeTx(extra)).toBeNull();

    for (const operation of [2, -1, '0', null]) {
      expect(
        decodeSafeTx({
          ...typedData({}),
          message: { ...typedData({}).message, operation },
        }),
      ).toBeNull();
    }

    expect(decodeSafeTx(typedData({ value: '-1' }))).toBeNull();
    expect(decodeSafeTx(typedData({ data: '0x0' }))).toBeNull();
    expect(decodeSafeTx(typedData({ to: 'not-an-address' }))).toBeNull();
  });
});

describe('decodeSafeTx call classification', () => {
  it('classifies a native transfer by empty calldata', () => {
    const decoded = decodeSafeTx(typedData({ to: NATIVE_TARGET, value: '123', data: '0x' }));

    expect(decoded?.calls).toHaveLength(1);
    expect(decoded?.calls[0]).toEqual({
      to: NATIVE_TARGET,
      value: 123n,
      data: '0x',
      operation: 0,
      kind: 'native',
    });
  });

  it('classifies a 68-byte transfer selector as an ERC-20 transfer', () => {
    const decoded = decodeSafeTx(
      typedData({
        to: BASE_USDC,
        data: erc20Transfer(RECIPIENT, 42n),
      }),
    );

    expect(decoded?.calls[0]).toMatchObject({
      kind: 'erc20-transfer',
      recipient: RECIPIENT,
      amount: 42n,
    });
  });

  it('classifies other calldata as a contract call', () => {
    const approve = `0x095ea7b3${RECIPIENT.slice(2).toLowerCase().padStart(64, '0')}${'f'.repeat(64)}`;
    const approveDecoded = decodeSafeTx(typedData({ to: NATIVE_TARGET, data: approve }));
    expect(approveDecoded?.calls[0].kind).toBe('contract-call');

    // 67 bytes: a transfer selector with one byte missing is not a transfer
    const shortTransfer = `${erc20Transfer(RECIPIENT, 42n)}00`.slice(0, -2 * 2);
    const shortDecoded = decodeSafeTx(typedData({ to: BASE_USDC, data: shortTransfer }));
    expect(shortDecoded?.calls[0].kind).toBe('contract-call');
    expect(shortDecoded?.calls[0].amount).toBeUndefined();
  });

  it('decodes operation 1 into each pinned MultiSendCallOnly address', () => {
    expect(MULTISEND_CALL_ONLY_ADDRESSES).toHaveLength(6);
    for (const multiSend of MULTISEND_CALL_ONLY_ADDRESSES) {
      const decoded = decodeSafeTx(
        typedData({
          to: multiSend,
          operation: 1,
          data: encodeMultiSend([{ operation: 0, to: NATIVE_TARGET, value: 7n, data: '0x' }]),
        }),
      );

      expect(decoded?.batch, multiSend).toEqual({
        target: multiSend,
        knownMultiSendCallOnly: true,
        decoded: true,
      });
      expect(decoded?.calls, multiSend).toHaveLength(1);
      expect(decoded?.calls[0], multiSend).toMatchObject({
        to: NATIVE_TARGET,
        value: 7n,
        kind: 'native',
      });
    }
  });

  it('flags an inner non-zero operation as a delegatecall inside the batch', () => {
    const decoded = decodeSafeTx(
      typedData({
        to: ETHEREUM_MULTISEND_CALL_ONLY,
        operation: 1,
        data: encodeMultiSend([
          { operation: 0, to: NATIVE_TARGET, value: 1n, data: '0x' },
          { operation: 1, to: RECIPIENT, value: 2n, data: '0xabcdef' },
        ]),
      }),
    );

    expect(decoded?.calls.map((call) => call.kind)).toEqual(['native', 'inner-delegatecall']);
    expect(decoded?.calls[1]).toMatchObject({
      operation: 1,
      to: RECIPIENT,
      value: 2n,
      data: '0xabcdef',
    });
  });

  it('shows operation 1 to an unknown contract as not decoded', () => {
    const decoded = decodeSafeTx(
      typedData({
        to: UNKNOWN_DELEGATE_TARGET,
        operation: 1,
        data: '0x1234',
      }),
    );

    expect(decoded?.batch).toEqual({
      target: UNKNOWN_DELEGATE_TARGET,
      knownMultiSendCallOnly: false,
      decoded: false,
    });
    expect(decoded?.calls).toEqual([
      {
        to: UNKNOWN_DELEGATE_TARGET,
        value: 0n,
        data: '0x1234',
        operation: 1,
        kind: 'not-decoded',
      },
    ]);
  });

  it('shows operation 1 with a non-zero value as not decoded', () => {
    const decoded = decodeSafeTx(
      typedData({
        to: ETHEREUM_MULTISEND_CALL_ONLY,
        operation: 1,
        value: '1',
        data: encodeMultiSend([{ operation: 0, to: NATIVE_TARGET, value: 1n, data: '0x' }]),
      }),
    );

    expect(decoded?.batch).toEqual({
      target: ETHEREUM_MULTISEND_CALL_ONLY,
      knownMultiSendCallOnly: true,
      decoded: false,
    });
    expect(decoded?.calls).toHaveLength(1);
    expect(decoded?.calls[0].kind).toBe('not-decoded');
  });

  it('shows a truncated or undecodable batch blob as not decoded', () => {
    const valid = encodeMultiSend([{ operation: 0, to: NATIVE_TARGET, value: 1n, data: '0xabcd' }]);
    const candidates = [
      // truncated packed call
      `${valid.slice(0, -6)}`,
      // bytes length larger than the payload
      `${valid.slice(0, 8 + 64)}${(9999).toString(16).padStart(64, '0')}${valid.slice(8 + 128)}`,
      // missing multiSend selector
      `0xdeadbeef${valid.slice(10)}`,
      // only the selector
      '0x8d80ff0a',
      // empty blob
      '0x',
    ];

    for (const data of candidates) {
      const decoded = decodeSafeTx(
        typedData({
          to: ETHEREUM_MULTISEND_CALL_ONLY,
          operation: 1,
          data,
        }),
      );
      expect(decoded?.batch?.decoded, data).toBe(false);
      expect(decoded?.calls, data).toHaveLength(1);
      expect(decoded?.calls[0], data).toMatchObject({
        kind: 'not-decoded',
        operation: 1,
        data,
      });
    }
  });
});

describe('decodeSafeTx refund', () => {
  const nonZeroFields = [
    ['gasPrice', '7'],
    ['safeTxGas', '21000'],
    ['baseGas', '5000'],
    ['gasToken', BASE_USDC],
    ['refundReceiver', RECIPIENT],
  ] as const;

  it('is null when every refund field is zero', () => {
    expect(decodeSafeTx(typedData({}))?.refund).toBeNull();
  });

  it('is set by each non-zero refund field', () => {
    for (const [field, value] of nonZeroFields) {
      const decoded = decodeSafeTx(typedData({ [field]: value }));
      expect(decoded?.refund, field).not.toBeNull();
      expect(decoded?.refund?.[field], field).toBe(
        field === 'gasPrice' || field === 'safeTxGas' || field === 'baseGas'
          ? BigInt(value)
          : value,
      );
    }
  });

  it('keeps every field when several are set', () => {
    const decoded = decodeSafeTx(
      typedData({
        gasPrice: '1',
        safeTxGas: '2',
        baseGas: '3',
        gasToken: BASE_USDC,
        refundReceiver: RECIPIENT,
      }),
    );

    expect(decoded?.refund).toEqual({
      gasPrice: 1n,
      safeTxGas: 2n,
      baseGas: 3n,
      gasToken: BASE_USDC,
      refundReceiver: RECIPIENT,
    });
  });
});
