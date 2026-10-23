import { describe, expect, it } from '@jest/globals';
import type { InfiniteData } from '@tanstack/react-query';
import type {
  AddressAction as Action,
  ActionChain,
  PendingAction,
  Response as WalletActionsResponse,
} from 'src/modules/zerion-api/requests/wallet-get-actions';
import { getHistoryActionsParams } from 'src/ui/pages/History/getHistoryActionsParams';
import {
  getLocalPendingActions,
  getRequestLocalPending,
} from './getLocalPendingActions';
import { isSupersededLocalAction } from './mergePendingEntries';
import { getLocalPendingDelay } from './pendingActionsPoll';

// WLT-3016: the wallet that sent the Zama Claim and the swap on Base.
const SENDER = '0x42B9dF65B219B3dD36fF330a4DD8F327A6aDa990';
const ADDRESS = SENDER.toLowerCase();
const OTHER_SENDER = '0x1231deb6f5749ef6ce6943a275a1d3e7486f4eae';
const LOCAL_HASH =
  '0x5c504ed432cb51138bcf09aa5e8a410dd4a1e204ef84bfed1be16dfba1b22060';
const SECOND_HASH =
  '0x37b77cd8656ce388f58785f5dc69ecbbd98a137fd5556a8be932d3494371411e';
const REPLACEMENT_HASH = `0x${'7'.repeat(64)}`;
const UNRELATED_HASH = `0x${'1'.repeat(64)}`;
const SOLANA_SIGNATURE =
  '5VERv8NMvzbJMEkV8xnrLkEaWRtSz9CosKDYjCJjBRnbJLgp8uirBgmQpjKhoR4tjF3ZpRzrFmBV6UjKdiSZkQUW';
const SOLANA_SENDER = 'DRpbCBMxVnDK7maPM5tGv6MvB3v1sRMC86PZ8okm21hy';
const NONCE = 42;
const SENT_MS = Date.parse('2026-10-20T14:09:04Z');

const base: ActionChain = { id: 'base', name: 'Base', iconUrl: null };
const polygon: ActionChain = { id: 'polygon', name: 'Polygon', iconUrl: null };
const solana: ActionChain = { id: 'solana', name: 'Solana', iconUrl: null };

type Tx = NonNullable<Action['acts']>[number]['transaction'];

function act(transaction: Tx): NonNullable<Action['acts']>[number] {
  return {
    type: { value: 'send', displayValue: 'Send' },
    label: null,
    content: { transfers: null, approvals: null },
    rate: null,
    status: 'pending',
    transaction,
  };
}

function action(
  id: string,
  timestamp: number,
  status: Action['status'],
  transactions: Tx[]
): Action {
  return {
    id,
    address: ADDRESS,
    timestamp,
    status,
    type: { value: 'send', displayValue: 'Send' },
    label: null,
    fee: null,
    refund: null,
    transaction: null,
    content: null,
    acts: transactions.map((transaction) => ({
      ...act(transaction),
      status,
    })),
  };
}

function tx(
  hash: string,
  identity: {
    chain?: ActionChain;
    sender?: string | null;
    nonce?: number | null;
  } = {}
): Tx {
  const { chain = base, ...rest } = identity;
  return { chain, hash, explorerUrl: null, ...rest };
}

const known = { sender: SENDER, nonce: NONCE };

function local(transactions: Tx[] = [tx(LOCAL_HASH, known)]): Action {
  return action(LOCAL_HASH, SENT_MS, 'pending', transactions);
}

function indexed(
  hash: string,
  identity: Parameters<typeof tx>[1],
  status: Action['status'] = 'confirmed',
  timestamp = SENT_MS + 30_000
): Action {
  return action(`indexed-${hash}`, timestamp, status, [tx(hash, identity)]);
}

function backendRow(
  status: PendingAction['status'],
  transaction: Tx
): PendingAction {
  const row = action(`order-${status}`, SENT_MS, 'pending', [transaction]);
  return {
    ...row,
    status,
    acts: (row.acts ?? []).map((item) => ({ ...item, status: '' as const })),
    pendingActionId: `order-${status}`,
    availableAt: null,
    expiresAt: null,
  };
}

const NONE = { actions: [], pending: [], unsigned: [] };

function mined(row: Action): Action {
  return {
    ...row,
    status: 'confirmed',
    acts: (row.acts ?? []).map((item) => ({ ...item, status: 'confirmed' })),
  };
}

describe('WLT-2951 AC1: the three wire shapes reach the matcher', () => {
  it('an indexed action with sender + nonce supersedes by nonce', () => {
    expect(
      isSupersededLocalAction(local(), {
        ...NONE,
        actions: [indexed(REPLACEMENT_HASH, known)],
      })
    ).toBe(true);
  });

  it('an indexed action with both null never supersedes by nonce', () => {
    expect(
      isSupersededLocalAction(local(), {
        ...NONE,
        actions: [indexed(REPLACEMENT_HASH, { sender: null, nonce: null })],
      })
    ).toBe(false);
  });

  it('a pending row without either field matches by hash only', () => {
    expect(
      isSupersededLocalAction(local(), {
        ...NONE,
        pending: [backendRow('pending', tx(REPLACEMENT_HASH))],
      })
    ).toBe(false);
    expect(
      isSupersededLocalAction(local(), {
        ...NONE,
        pending: [backendRow('pending', tx(LOCAL_HASH))],
      })
    ).toBe(true);
  });
});

describe('WLT-2951 AC3: a local row leaves Pending iff rule 1 (hash) or rule 2 (chain + sender + nonce) holds', () => {
  it.each<
    [
      string,
      Action,
      {
        actions: Action[];
        pending: PendingAction[];
        unsigned: PendingAction[];
      },
      boolean
    ]
  >([
    [
      'same hash on a non-first act → superseded',
      local([tx(LOCAL_HASH), tx(SECOND_HASH)]),
      { ...NONE, actions: [indexed(SECOND_HASH, {})] },
      true,
    ],
    [
      'hash differing only in case → superseded',
      local([tx(LOCAL_HASH)]),
      {
        ...NONE,
        actions: [indexed(`0x${LOCAL_HASH.slice(2).toUpperCase()}`, {})],
      },
      true,
    ],
    [
      'same chain + sender + nonce, different hash (speed-up or cancel) → superseded',
      local(),
      { ...NONE, actions: [indexed(REPLACEMENT_HASH, known)] },
      true,
    ],
    [
      'higher nonce → superseded',
      local(),
      {
        ...NONE,
        actions: [
          indexed(REPLACEMENT_HASH, { sender: SENDER, nonce: NONCE + 1 }),
        ],
      },
      true,
    ],
    [
      'a failed indexed action with the same nonce → superseded',
      local(),
      { ...NONE, actions: [indexed(REPLACEMENT_HASH, known, 'failed')] },
      true,
    ],
    [
      'sender differing only in case → superseded',
      local(),
      {
        ...NONE,
        actions: [indexed(REPLACEMENT_HASH, { sender: ADDRESS, nonce: NONCE })],
      },
      true,
    ],
    [
      'lower nonce → stays',
      local(),
      {
        ...NONE,
        actions: [
          indexed(REPLACEMENT_HASH, { sender: SENDER, nonce: NONCE - 1 }),
        ],
      },
      false,
    ],
    [
      'same nonce on a different chain → stays',
      local(),
      {
        ...NONE,
        actions: [indexed(REPLACEMENT_HASH, { ...known, chain: polygon })],
      },
      false,
    ],
    [
      'same nonce with a different sender (an incoming transfer) → stays',
      local(),
      {
        ...NONE,
        actions: [
          indexed(REPLACEMENT_HASH, { sender: OTHER_SENDER, nonce: NONCE }),
        ],
      },
      false,
    ],
    [
      'backend nonce null → stays',
      local(),
      {
        ...NONE,
        actions: [indexed(REPLACEMENT_HASH, { sender: SENDER, nonce: null })],
      },
      false,
    ],
    [
      'local nonce unknown, same-nonce indexed action → stays (hash-only)',
      local([tx(LOCAL_HASH)]),
      { ...NONE, actions: [indexed(REPLACEMENT_HASH, known)] },
      false,
    ],
    [
      'local nonce unknown, same hash indexed → superseded (hash-only)',
      local([tx(LOCAL_HASH)]),
      { ...NONE, actions: [indexed(LOCAL_HASH, {})] },
      true,
    ],
    [
      'a backend pending row with the same chain, sender and nonce but a different hash → stays',
      local(),
      {
        ...NONE,
        pending: [backendRow('pending', tx(REPLACEMENT_HASH, known))],
      },
      false,
    ],
    [
      'a backend unsigned row with the same chain, sender and nonce but a different hash → stays',
      local(),
      {
        ...NONE,
        unsigned: [backendRow('unsigned', tx(REPLACEMENT_HASH, known))],
      },
      false,
    ],
    [
      'Solana, a newer indexed transaction from the same sender → stays (hash-only)',
      local([tx(SOLANA_SIGNATURE, { chain: solana })]),
      {
        ...NONE,
        actions: [
          indexed(UNRELATED_HASH, {
            chain: solana,
            sender: SOLANA_SENDER,
            nonce: null,
          }),
        ],
      },
      false,
    ],
    [
      'Solana, the same signature indexed → superseded (hash-only)',
      local([tx(SOLANA_SIGNATURE, { chain: solana })]),
      {
        ...NONE,
        actions: [
          indexed(SOLANA_SIGNATURE, {
            chain: solana,
            sender: SOLANA_SENDER,
            nonce: null,
          }),
        ],
      },
      true,
    ],
  ])('%s', (_name, localAction, lists, superseded) => {
    expect(isSupersededLocalAction(localAction, lists)).toBe(superseded);
  });
});

function cache(data: Action[]): InfiniteData<WalletActionsResponse> {
  return {
    pages: [
      {
        data,
        pending: [],
        unsigned: [],
        pendingListsAvailable: true,
        meta: { pagination: { cursor: '' } },
      },
    ],
    pageParams: [undefined],
  };
}

function historyPayload(
  filters: Partial<Parameters<typeof getHistoryActionsParams>[0]> = {}
) {
  return getHistoryActionsParams({
    address: ADDRESS,
    currency: 'usd',
    isOwnWallet: true,
    ...filters,
  });
}

function historyLocalPending(localActions: Action[], actions: Action[]) {
  return getLocalPendingActions({
    localActions,
    actions,
    pending: [],
    unsigned: [],
    contentFiltered: false,
  });
}

describe('WLT-2951 AC4: History and the poll gating share the matcher', () => {
  it('a nonce-superseded row leaves both, and the poll gating stops', () => {
    const row = local();
    const older = indexed(UNRELATED_HASH, {}, 'confirmed', SENT_MS - 60_000);
    const nowMs = SENT_MS + 10_000;
    const params = historyPayload();

    expect(historyLocalPending([row], [older])).toEqual([row]);
    expect(
      getLocalPendingDelay(
        getRequestLocalPending(params, [row], cache([older])),
        nowMs
      )
    ).not.toBeNull();

    const replacement = indexed(REPLACEMENT_HASH, known);
    const loaded = [replacement, older];
    expect(historyLocalPending([row], loaded)).toEqual([]);
    const gated = getRequestLocalPending(params, [row], cache(loaded));
    expect(gated).toEqual([]);
    expect(getLocalPendingDelay(gated, nowMs)).toBeNull();
  });
});

describe('WLT-2951 AC5 (amended): the timestamp rule is dropped only for an unfiltered row with a known sender + nonce', () => {
  const row = local();
  const newerUnrelated = indexed(
    UNRELATED_HASH,
    { sender: OTHER_SENDER, nonce: 7 },
    'confirmed',
    SENT_MS + 60_000
  );

  it('unfiltered: a newer unrelated loaded action keeps a still-pending local row', () => {
    expect(
      getRequestLocalPending(historyPayload(), [row], cache([newerUnrelated]))
    ).toEqual([row]);
  });

  it.each([
    ['an EVM row whose lookup resolved nothing', [tx(LOCAL_HASH)]],
    ['a Safe row (safeTxHash, never resolved)', [tx(`0x${'5'.repeat(64)}`)]],
    ['a Solana row', [tx(SOLANA_SIGNATURE, { chain: solana })]],
  ])(
    'unfiltered, %s: a newer loaded action hides it (the timestamp rule, as on origin/main)',
    (_name, transactions) => {
      // Extension: the timestamp rule applies once the node reports the row mined; a still-pending row is never hidden by age (WLT-1724).
      const identityLess = mined(local(transactions));
      expect(
        getRequestLocalPending(historyPayload(), [identityLess], cache([]))
      ).toEqual([identityLess]);
      expect(
        getRequestLocalPending(
          historyPayload(),
          [identityLess],
          cache([newerUnrelated])
        )
      ).toEqual([]);
      const stillPending = local(transactions);
      expect(
        getRequestLocalPending(
          historyPayload(),
          [stillPending],
          cache([newerUnrelated])
        )
      ).toEqual([stillPending]);
    }
  );

  it('unfiltered, with the device clock 1 h ahead: the row stays', () => {
    const aheadRow = { ...row, timestamp: SENT_MS + 3_600_000 };
    const arrivedLater = { ...newerUnrelated, timestamp: SENT_MS + 7_200_000 };
    expect(
      getRequestLocalPending(
        historyPayload(),
        [aheadRow],
        cache([arrivedLater])
      )
    ).toEqual([aheadRow]);
  });

  it('chain-filtered: same result as unfiltered', () => {
    expect(
      getRequestLocalPending(
        historyPayload({ chain: 'base' }),
        [row],
        cache([newerUnrelated])
      )
    ).toEqual([row]);
  });

  it.each([
    ['type', { actionTypes: ['receive' as const] }],
    ['asset', { assetTypes: ['fungible' as const] }],
    ['search', { searchQuery: 'usdc' }],
  ])(
    '%s-filtered: a newer loaded action hides the row (the timestamp rule)',
    (_name, filters) => {
      // Extension: the timestamp rule applies once the node reports the row mined; a still-pending row is never hidden by age (WLT-1724).
      const params = historyPayload(filters);
      const minedRow = mined(row);
      expect(getRequestLocalPending(params, [minedRow], cache([]))).toEqual([
        minedRow,
      ]);
      expect(
        getRequestLocalPending(params, [minedRow], cache([newerUnrelated]))
      ).toEqual([]);
      expect(
        getRequestLocalPending(params, [row], cache([newerUnrelated]))
      ).toEqual([row]);
    }
  );
});
