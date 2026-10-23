import { describe, expect, it } from '@jest/globals';
import type { LocalAddressAction } from 'src/modules/ethereum/transactions/addressAction';
import type { ActionChain } from 'src/modules/zerion-api/requests/wallet-get-actions';
import {
  lookupTransactionIdentity,
  withTransactionIdentity,
} from './lookupTransactionIdentity';
import { isSupersededLocalAction } from './mergePendingEntries';

// WLT-3016: the swap sent from 0x42b9…a990 on Base.
const SENDER = '0x42B9dF65B219B3dD36fF330a4DD8F327A6aDa990';
const ADDRESS = SENDER.toLowerCase();
const SWAP_HASH =
  '0x5c504ed432cb51138bcf09aa5e8a410dd4a1e204ef84bfed1be16dfba1b22060';
const SOLANA_SIGNATURE =
  '5VERv8NMvzbJMEkV8xnrLkEaWRtSz9CosKDYjCJjBRnbJLgp8uirBgmQpjKhoR4tjF3ZpRzrFmBV6UjKdiSZkQUW';
const NONCE = 42;

const base: ActionChain = { id: 'base', name: 'Base', iconUrl: null };
const polygon: ActionChain = { id: 'polygon', name: 'Polygon', iconUrl: null };
const solana: ActionChain = { id: 'solana', name: 'Solana', iconUrl: null };

type LocalAct = NonNullable<LocalAddressAction['acts']>[number];

function act(chain: ActionChain, hash: string): LocalAct {
  return {
    type: { value: 'send', displayValue: 'Send' },
    label: null,
    content: { transfers: null, approvals: null },
    rate: null,
    status: 'pending',
    transaction: { chain, hash, explorerUrl: null },
  };
}

// Mirrors pendingEvmTxToAddressAction: `rawTransaction` is the transaction the wallet signed, null for Solana.
function localAction(
  hash: string,
  acts: LocalAct[],
  rawTransaction: LocalAddressAction['rawTransaction']
): LocalAddressAction {
  return {
    id: hash,
    address: ADDRESS,
    timestamp: Date.parse('2026-10-20T14:09:04Z'),
    status: 'pending',
    type: { value: 'send', displayValue: 'Send' },
    label: null,
    fee: null,
    refund: null,
    content: null,
    transaction: null,
    acts,
    rawTransaction,
    local: true,
  };
}

function signed(
  overrides: Partial<NonNullable<LocalAddressAction['rawTransaction']>> = {}
): LocalAddressAction['rawTransaction'] {
  return {
    hash: SWAP_HASH,
    chain: 'base',
    from: SENDER,
    nonce: NONCE,
    ...overrides,
  };
}

describe('WLT-2951 AC2: the sender + nonce of a local action', () => {
  it('found in the signed transaction: writes sender and nonce onto the acts with that hash on that chain, status unchanged', () => {
    const action = withTransactionIdentity(
      localAction(
        SWAP_HASH,
        [act(base, SWAP_HASH), act(polygon, SWAP_HASH)],
        signed()
      )
    );

    expect(action.acts?.map((item) => item.transaction)).toEqual([
      {
        chain: base,
        hash: SWAP_HASH,
        explorerUrl: null,
        sender: SENDER,
        nonce: NONCE,
      },
      { chain: polygon, hash: SWAP_HASH, explorerUrl: null },
    ]);
    expect(action.status).toBe('pending');
    expect(action.acts?.map((item) => item.status)).toEqual([
      'pending',
      'pending',
    ]);
  });

  it('a two-chain local row: a destination-chain transaction from the same sender does not supersede it', () => {
    const local = withTransactionIdentity(
      localAction(
        SWAP_HASH,
        [act(base, SWAP_HASH), act(polygon, SWAP_HASH)],
        signed()
      )
    );
    const polygonHash = `0x${'7'.repeat(64)}`;
    const polygonTransfer = {
      ...local,
      id: 'indexed-polygon',
      status: 'confirmed' as const,
      acts: [
        {
          ...act(polygon, polygonHash),
          status: 'confirmed' as const,
          transaction: {
            chain: polygon,
            hash: polygonHash,
            explorerUrl: null,
            sender: SENDER,
            nonce: NONCE + 100,
          },
        },
      ],
    };
    expect(
      isSupersededLocalAction(local, {
        actions: [polygonTransfer],
        pending: [],
        unsigned: [],
      })
    ).toBe(false);
  });

  it.each([
    ['no sender', signed({ from: null })],
    [
      'a negative nonce (an action not built from a signed transaction)',
      signed({ nonce: -1 }),
    ],
  ])('%s in the signed transaction: writes nothing', (_name, raw) => {
    const action = localAction(SWAP_HASH, [act(base, SWAP_HASH)], raw);
    expect(lookupTransactionIdentity(action)).toBeNull();
    expect(withTransactionIdentity(action)).toBe(action);
  });

  it('a Solana action is never looked up', () => {
    const action = localAction(
      SOLANA_SIGNATURE,
      [act(solana, SOLANA_SIGNATURE)],
      null
    );
    expect(lookupTransactionIdentity(action)).toBeNull();
    const result = withTransactionIdentity(action);
    expect(result.acts?.[0].transaction).toEqual({
      chain: solana,
      hash: SOLANA_SIGNATURE,
      explorerUrl: null,
    });
    expect(result.status).toBe('pending');
  });

  it('a nonce of 0 is a known identity', () => {
    expect(
      lookupTransactionIdentity(
        localAction(SWAP_HASH, [act(base, SWAP_HASH)], signed({ nonce: 0 }))
      )
    ).toEqual({ chainId: 'base', hash: SWAP_HASH, sender: SENDER, nonce: 0 });
  });
});
