import type { SerializableTransactionResponse } from 'src/modules/ethereum/types/TransactionResponsePlain';
import {
  txPlainToEthersV5TransactionResponse,
  v5ToPlainTransactionResponse,
  type EthersV5TransactionResponse,
} from './ethers-v5-types';

/** A number in the shape ethers v5 left in browser storage */
function legacy(hex: unknown) {
  return { _hex: hex, _isBigNumber: true };
}

/** Shape copied from the storage sample documented in ethers-v5-types.ts */
const stored = {
  chainId: legacy('0x0849ea'),
  data: '0x83d13',
  from: '0x42b9dF65B219B3dD36FF330A4dD8f327A6Ada990',
  gasLimit: legacy('0x0c29b9'),
  hash: '0xa72edd8e33a675cc9e5d4e719f0e084d7f3bc756bc2a7cd7e9e17675a7a4c5ef',
  maxFeePerGas: legacy('0x0564eba0'),
  maxPriorityFeePerGas: legacy('0x00'),
  nonce: 158,
  to: '0xe4C82643A4F9Fd288322cc6fBd7C48AB068B38D3',
  type: 113,
  value: legacy('0x00'),
} as unknown as EthersV5TransactionResponse;

const plain: SerializableTransactionResponse = {
  blockHash: null,
  blockNumber: null,
  chainId: '0x1',
  data: '0x',
  from: '0x42b9dF65B219B3dD36FF330A4dD8f327A6Ada990',
  gasLimit: '21000',
  gasPrice: '1000000000',
  hash: '0xa72edd8e33a675cc9e5d4e719f0e084d7f3bc756bc2a7cd7e9e17675a7a4c5ef',
  index: 0,
  maxFeePerBlobGas: null,
  maxFeePerGas: null,
  maxPriorityFeePerGas: null,
  nonce: 7,
  to: '0xe4C82643A4F9Fd288322cc6fBd7C48AB068B38D3',
  type: 0,
  value: '1',
};

/**
 * What ends up in browser storage: only an object's own enumerable
 * properties, without its prototype. Makes results comparable no matter which
 * class produced them.
 */
function asStored(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(asStored);
  }
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, asStored(item)]));
  }
  return value;
}

function outcome(run: () => unknown): string {
  try {
    return `returns ${JSON.stringify(asStored(run()))}`;
  } catch {
    return 'throws';
  }
}

describe('v5ToPlainTransactionResponse', () => {
  it('reads a transaction that ethers v5 wrote into storage', () => {
    expect(v5ToPlainTransactionResponse(stored)).toEqual({
      blockHash: null,
      blockNumber: null,
      chainId: '0x849ea',
      data: '0x83d13',
      from: '0x42b9dF65B219B3dD36FF330A4dD8f327A6Ada990',
      gasLimit: '797113',
      gasPrice: '0',
      hash: '0xa72edd8e33a675cc9e5d4e719f0e084d7f3bc756bc2a7cd7e9e17675a7a4c5ef',
      index: 0,
      maxFeePerBlobGas: null,
      maxFeePerGas: '90500000',
      maxPriorityFeePerGas: '0',
      nonce: 158,
      to: '0xe4C82643A4F9Fd288322cc6fBd7C48AB068B38D3',
      type: 113,
      value: '0',
    });
  });

  it('reads a transaction stored with plain strings and a numeric chain id', () => {
    const result = v5ToPlainTransactionResponse({
      ...stored,
      chainId: 8453,
      gasLimit: '21000',
      value: '1000000000000000000',
    });
    expect(result.chainId).toBe('0x2105');
    expect(result.gasLimit).toBe('21000');
    expect(result.value).toBe('1000000000000000000');
  });

  it('gives the recorded outcome for every representation of every numeric field', () => {
    const representations: Array<[string, unknown]> = [
      ['stored number', legacy('0x5208')],
      ['stored zero', legacy('0x00')],
      ['stored number with odd digits', legacy('0x1')],
      ['stored number with upper-case digits', legacy('0xABCDEF')],
      ['stored number with an empty hex', legacy('0x')],
      ['stored number with a broken hex', legacy('0xzz')],
      ['stored number without hex', legacy(undefined)],
      ['decimal string', '21000'],
      ['hex string', '0x5208'],
      ['zero string', '0'],
      ['empty string', ''],
      ['garbage string', 'abc'],
      ['negative string', '-1'],
      ['fraction string', '1.5'],
      ['number', 21000],
      ['zero', 0],
      ['fraction', 1.5],
      ['bigint', 21000n],
      ['undefined', undefined],
      ['null', null],
    ];
    const fields = [
      'chainId',
      'gasLimit',
      'gasPrice',
      'value',
      'maxFeePerGas',
      'maxPriorityFeePerGas',
      'nonce',
    ];
    const table: Record<string, string> = {};
    for (const field of fields) {
      for (const [name, representation] of representations) {
        const input = {
          ...stored,
          [field]: representation,
        } as unknown as EthersV5TransactionResponse;
        table[`${field}: ${name}`] = outcome(() => v5ToPlainTransactionResponse(input));
      }
    }
    expect(table).toMatchSnapshot();
  });

  it('gives the recorded outcome for optional fields that are missing', () => {
    const table: Record<string, string> = {};
    for (const field of ['to', 'type', 'blockHash', 'blockNumber', 'gasPrice', 'maxFeePerGas']) {
      const input = { ...stored, blockHash: '0xabc', blockNumber: 12, [field]: undefined };
      table[`without ${field}`] = outcome(() =>
        v5ToPlainTransactionResponse(input as unknown as EthersV5TransactionResponse),
      );
    }
    expect(table).toMatchSnapshot();
  });
});

describe('txPlainToEthersV5TransactionResponse', () => {
  it('writes the chain id in the shape existing storage uses', () => {
    expect(asStored(txPlainToEthersV5TransactionResponse(plain).chainId)).toEqual({
      _hex: '0x01',
      _isBigNumber: true,
    });
    expect(
      asStored(txPlainToEthersV5TransactionResponse({ ...plain, chainId: '0x2105' }).chainId),
    ).toEqual({ _hex: '0x2105', _isBigNumber: true });
    expect(
      asStored(txPlainToEthersV5TransactionResponse({ ...plain, chainId: '0xa' }).chainId),
    ).toEqual({ _hex: '0x0a', _isBigNumber: true });
  });

  it('gives the recorded stored shape for a pending and for a mined transaction', () => {
    const mined: SerializableTransactionResponse = {
      ...plain,
      blockHash: '0xabc',
      blockNumber: 12,
      type: 2,
      gasPrice: null,
      maxFeePerGas: '2000000000',
      maxPriorityFeePerGas: '1000000000',
      to: null,
    };
    expect({
      pending: outcome(() => txPlainToEthersV5TransactionResponse(plain)),
      mined: outcome(() => txPlainToEthersV5TransactionResponse(mined)),
    }).toMatchSnapshot();
  });

  it('gives the recorded stored chain id for every form of chain id', () => {
    const chainIds = [
      '0x0',
      '0x00',
      '0x1',
      '0x01',
      '0xa',
      '0xA',
      '0x89',
      '0x2105',
      '0xa4b1',
      '0xA4B1',
      '0x0849ea',
      '0xffffffffffffffff',
      '1',
      '137',
      '',
      '0x',
      'abc',
      '-0x1',
      '-1',
    ];
    const table: Record<string, string> = {};
    for (const chainId of chainIds) {
      table[JSON.stringify(chainId)] = outcome(
        () => txPlainToEthersV5TransactionResponse({ ...plain, chainId }).chainId,
      );
    }
    expect(table).toMatchSnapshot();
  });

  it('round-trips through the stored shape', () => {
    const roundTripped = v5ToPlainTransactionResponse(
      asStored(txPlainToEthersV5TransactionResponse(plain)) as EthersV5TransactionResponse,
    );
    expect(roundTripped.chainId).toBe('0x1');
    expect(roundTripped.nonce).toBe(7);
    expect(roundTripped.gasLimit).toBe('21000');
    expect(roundTripped.gasPrice).toBe('1000000000');
    expect(roundTripped.value).toBe('1');
  });

  it('round-trips every chain id from 0 to 5000 and large ids through the stored shape', () => {
    const ids = [...Array(5001).keys()].map(BigInt);
    ids.push(42161n, 8453n, 534352n, 11155111n, 1313161554n, 2n ** 64n, 2n ** 128n);
    for (const id of ids) {
      const chainId = `0x${id.toString(16)}`;
      const storedTransaction = asStored(
        txPlainToEthersV5TransactionResponse({ ...plain, chainId }),
      );
      expect(
        v5ToPlainTransactionResponse(storedTransaction as EthersV5TransactionResponse).chainId,
      ).toBe(chainId);
    }
  });
});
