import {
  LOCAL_TRANSACTION_TTL_MS,
  getExpiredTransactions,
  getTransactionNetworkKey,
} from './getExpiredTransactions';
import type { TransactionObject } from './types';

const now = 1_800_000_000_000;
const expiredAt = now - LOCAL_TRANSACTION_TTL_MS - 1;
const freshAt = now - LOCAL_TRANSACTION_TTL_MS + 1;

function evm(hash: string, chainId: number, timestamp: number) {
  return {
    hash,
    transaction: { chainId, from: '0x1', nonce: 0 },
    timestamp,
    initiator: 'test',
  } as unknown as TransactionObject;
}

function solana(signature: string, timestamp: number) {
  return {
    signature,
    publicKey: 'pk',
    solanaBase64: '',
    signatureStatus: null,
    timestamp,
    initiator: 'test',
  } as unknown as TransactionObject;
}

describe('getExpiredTransactions', () => {
  test('network key is a normalized chain id for evm and solana otherwise', () => {
    expect(getTransactionNetworkKey(evm('0xa', 1, now))).toBe('0x1');
    expect(getTransactionNetworkKey(solana('sig', now))).toBe('solana');
  });

  test('removes only expired items on networks with history', () => {
    const transactions = [
      evm('0xexpired-supported', 1, expiredAt),
      evm('0xfresh-supported', 1, freshAt),
      evm('0xexpired-unsupported', 999999, expiredAt),
      solana('sig-expired', expiredAt),
      solana('sig-fresh', freshAt),
    ];
    const result = getExpiredTransactions(transactions, {
      now,
      networksWithHistory: new Set(['0x1', 'solana']),
    });
    expect(result.map((item) => item.hash ?? item.signature)).toEqual([
      '0xexpired-supported',
      'sig-expired',
    ]);
  });

  test('keeps everything when no network is known to have history', () => {
    const transactions = [evm('0xa', 1, expiredAt), solana('sig', expiredAt)];
    expect(
      getExpiredTransactions(transactions, {
        now,
        networksWithHistory: new Set(),
      })
    ).toEqual([]);
  });
});
