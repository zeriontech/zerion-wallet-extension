import type { AnyAddressAction } from 'src/modules/ethereum/transactions/addressAction';
import type { IncomingTransaction } from 'src/modules/ethereum/types/IncomingTransaction';
import {
  createCancelTransaction,
  fromAddressActionTransaction,
  isCancelTx,
  removeGasPrice,
} from './accelerate-helpers';

type StoredTransaction = Parameters<typeof fromAddressActionTransaction>[0];

const ADDRESS = '0x42b9dF65B219B3dD36FF330A4dD8f327A6Ada990';

/** A number in the shape ethers v5 left in browser storage */
function legacy(hex: unknown) {
  return { _hex: hex, _isBigNumber: true };
}

function outcome(run: () => unknown): string {
  try {
    return `returns ${JSON.stringify(run())}`;
  } catch {
    return 'throws';
  }
}

const storedTransaction = {
  chain: 'ethereum',
  confirmations: 0,
  fee: null,
  status: 'pending',
  r: '0x1',
  s: '0x2',
  v: 27,
  hash: '0xa72edd8e33a675cc9e5d4e719f0e084d7f3bc756bc2a7cd7e9e17675a7a4c5ef',
  blockNumber: 1,
  blockHash: '0xabc',
  timestamp: 1,
  raw: '0x',
  wait: 'removed',
  chainId: legacy('0x01'),
  data: '0x',
  from: ADDRESS,
  to: '0xe4C82643A4F9Fd288322cc6fBd7C48AB068B38D3',
  nonce: 158,
  type: 2,
  gasLimit: legacy('0x5208'),
  maxFeePerGas: legacy('0x0564eba0'),
  maxPriorityFeePerGas: legacy('0x00'),
  value: legacy('0x0de0b6b3a7640000'),
};

describe('fromAddressActionTransaction', () => {
  it('turns numbers that ethers v5 wrote into storage back into hex strings', () => {
    expect(fromAddressActionTransaction(storedTransaction as unknown as StoredTransaction)).toEqual(
      {
        chainId: '0x01',
        data: '0x',
        from: ADDRESS,
        to: '0xe4C82643A4F9Fd288322cc6fBd7C48AB068B38D3',
        nonce: 158,
        type: 2,
        gasLimit: '0x5208',
        maxFeePerGas: '0x0564eba0',
        maxPriorityFeePerGas: '0x00',
        value: '0x0de0b6b3a7640000',
      },
    );
  });

  it('leaves strings and numbers as they are', () => {
    const transaction = {
      from: ADDRESS,
      nonce: 1,
      gasLimit: '21000',
      value: '0x1',
      data: '0xabcdef',
    };
    expect(fromAddressActionTransaction(transaction as unknown as StoredTransaction)).toEqual(
      transaction,
    );
  });

  it('does not change the object it was given', () => {
    const copy = JSON.parse(JSON.stringify(storedTransaction));
    fromAddressActionTransaction(storedTransaction as unknown as StoredTransaction);
    expect(storedTransaction).toEqual(copy);
  });

  it('gives the recorded outcome for every representation of a numeric field', () => {
    const representations: Array<[string, unknown]> = [
      ['stored number', legacy('0x5208')],
      ['stored zero', legacy('0x00')],
      ['stored number with odd digits', legacy('0x1')],
      ['stored number with leading zero bytes', legacy('0x000001')],
      ['stored number with upper-case digits', legacy('0xABCDEF')],
      ['stored number with an empty hex', legacy('0x')],
      ['stored negative number', legacy('-0x01')],
      ['stored number with a broken hex', legacy('0xzz')],
      ['stored number with a decimal string', legacy('12')],
      ['stored number with a numeric hex', legacy(5)],
      ['stored number without hex', legacy(undefined)],
      ['object without the marker', { _hex: '0x01' }],
      ['object with a false marker', { _hex: '0x01', _isBigNumber: false }],
      ['decimal string', '21000'],
      ['hex string', '0x5208'],
      ['number', 21000],
      ['null', null],
      ['undefined', undefined],
    ];
    const table: Record<string, string> = {};
    for (const field of ['gasLimit', 'value', 'chainId', 'nonce']) {
      for (const [name, representation] of representations) {
        const input = { from: ADDRESS, [field]: representation } as unknown as StoredTransaction;
        table[`${field}: ${name}`] = outcome(() => fromAddressActionTransaction(input));
      }
    }
    expect(table).toMatchSnapshot();
  });
});

describe('removeGasPrice', () => {
  it('drops the three gas price fields and keeps the rest', () => {
    const transaction = {
      from: ADDRESS,
      nonce: '0x1',
      gas: '0x5208',
      gasPrice: '0x1',
      maxFeePerGas: '0x2',
      maxPriorityFeePerGas: '0x3',
    } as unknown as IncomingTransaction;
    expect(removeGasPrice(transaction)).toEqual({ from: ADDRESS, nonce: '0x1', gas: '0x5208' });
  });
});

describe('createCancelTransaction', () => {
  it('sends zero value to the sender itself with the same nonce', () => {
    expect(createCancelTransaction({ from: ADDRESS, nonce: 7, chainId: '0x1' })).toEqual({
      from: ADDRESS,
      to: ADDRESS,
      value: '0x0',
      chainId: '0x1',
      data: '0x',
      nonce: 7,
    });
  });
});

describe('isCancelTx', () => {
  function localAction(rawTransaction: unknown, address = ADDRESS) {
    return { local: true, address, rawTransaction } as unknown as AnyAddressAction;
  }

  it('recognises a transaction to nobody with no value and no data', () => {
    expect(isCancelTx(localAction({ from: ADDRESS }))).toBe(true);
    expect(isCancelTx(localAction({ from: ADDRESS.toLowerCase() }))).toBe(true);
  });

  it('recognises zero value with empty data', () => {
    expect(isCancelTx(localAction({ from: ADDRESS, value: '0x0', data: '0x' }))).toBe(true);
    expect(isCancelTx(localAction({ from: ADDRESS, value: '0x', data: '0x0' }))).toBe(true);
  });

  it('rejects a transaction that moves value or carries data', () => {
    expect(isCancelTx(localAction({ from: ADDRESS, value: '0x1', data: '0x' }))).toBe(false);
    expect(isCancelTx(localAction({ from: ADDRESS, value: '0x0', data: '0xabcdef' }))).toBe(false);
  });

  it('rejects a transaction from another address, without a sender, or without a raw transaction', () => {
    const other = '0xe4C82643A4F9Fd288322cc6fBd7C48AB068B38D3';
    expect(isCancelTx(localAction({ from: other }))).toBe(false);
    expect(isCancelTx(localAction({}))).toBe(false);
    expect(isCancelTx(localAction(null))).toBe(false);
  });

  it('rejects an action that is not local', () => {
    expect(isCancelTx({ address: ADDRESS } as unknown as AnyAddressAction)).toBe(false);
  });

  it('gives the recorded outcome for every combination of value and data', () => {
    const values: unknown[] = [
      '0x',
      '0x0',
      '0x00',
      '0',
      0,
      legacy('0x00'),
      '0x1',
      '1',
      1,
      legacy('0x01'),
    ];
    const datas: unknown[] = ['0x', '0x0', '0x00', '0xabcdef'];
    const table: Record<string, string> = {};
    for (const value of values) {
      for (const data of datas) {
        table[`value ${JSON.stringify(value)}, data ${JSON.stringify(data)}`] = outcome(() =>
          isCancelTx(localAction({ from: ADDRESS, value, data })),
        );
      }
    }
    expect(table).toMatchSnapshot();
  });
});
