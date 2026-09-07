import { describe, expect, test } from '@jest/globals';
import { getTransactionObjectStatus } from './getTransactionObjectStatus';
import { getTransactionObjectId, type TransactionObject } from './types';

function order(
  orderStatus: 'pending' | 'successful' | 'failed' | 'rejected',
  extra: Partial<TransactionObject> = {}
): TransactionObject {
  return {
    orderId: 'zerox:abc',
    orderStatus,
    fills: [],
    from: '0x1111111111111111111111111111111111111111',
    chain: 'base',
    explorerUrlTemplate: null,
    timestamp: 1,
    initiator: 'chrome-extension://id',
    ...extra,
  } as TransactionObject;
}

describe('getTransactionObjectStatus: intent-swap orders', () => {
  test('maps order statuses onto action statuses', () => {
    expect(getTransactionObjectStatus(order('pending'))).toBe('pending');
    expect(getTransactionObjectStatus(order('successful'))).toBe('confirmed');
    expect(getTransactionObjectStatus(order('failed'))).toBe('failed');
    expect(getTransactionObjectStatus(order('rejected'))).toBe('failed');
  });

  test('a settled order with a fill hash is still read as an order', () => {
    const settled = order('successful', {
      hash: '0xfill',
      fills: [{ chain: 'base', hash: '0xfill' }],
    });
    expect(getTransactionObjectStatus(settled)).toBe('confirmed');
  });

  test('dropped never applies to orders', () => {
    expect(
      getTransactionObjectStatus(order('pending', { dropped: true }))
    ).toBe('pending');
  });
});

describe('getTransactionObjectId', () => {
  test('orderId wins over a fill hash so settle upserts onto the pending entry', () => {
    expect(getTransactionObjectId(order('pending'))).toBe('zerox:abc');
    expect(
      getTransactionObjectId(order('successful', { hash: '0xfill' }))
    ).toBe('zerox:abc');
  });

  test('evm and solana entries keep their keys', () => {
    expect(
      getTransactionObjectId({
        hash: '0xhash',
        transaction: {} as never,
        timestamp: 1,
        initiator: '',
      } as TransactionObject)
    ).toBe('0xhash');
    expect(
      getTransactionObjectId({
        signature: 'sig',
        publicKey: 'pk',
        solanaBase64: 'AA' as never,
        signatureStatus: null,
        timestamp: 1,
        initiator: '',
      } as TransactionObject)
    ).toBe('sig');
  });
});
