import { describe, expect, test } from '@jest/globals';
import type { TransactionObject } from 'src/modules/ethereum/transactions/types';
import { filterAddressTransactions } from './filterAddressTransactions';

const ME = '0x1111111111111111111111111111111111111111';
const OTHER = '0x2222222222222222222222222222222222222222';

const evm = (from: string): TransactionObject =>
  ({
    hash: `0x${from.slice(2, 6)}`,
    transaction: { from },
    timestamp: 1,
    initiator: '',
  } as unknown as TransactionObject);

const order = (from: string): TransactionObject =>
  ({
    orderId: `order:${from}`,
    orderStatus: 'pending',
    fills: [],
    from,
    chain: 'base',
    explorerUrlTemplate: null,
    timestamp: 1,
    initiator: '',
  } as TransactionObject);

describe('filterAddressTransactions', () => {
  test('orders are matched by their own `from`', () => {
    const txs = [evm(ME), order(ME), order(OTHER), evm(OTHER)];
    const mine = filterAddressTransactions({ address: ME }, txs);
    expect(mine).toHaveLength(2);
    expect(mine.map((t) => t.hash ?? t.orderId)).toEqual([
      '0x1111',
      `order:${ME}`,
    ]);
  });

  test('multiple addresses include orders too', () => {
    const txs = [order(ME), order(OTHER)];
    expect(
      filterAddressTransactions(
        { addresses: [ME.toLowerCase(), OTHER.toLowerCase()] },
        txs
      )
    ).toHaveLength(2);
  });
});
