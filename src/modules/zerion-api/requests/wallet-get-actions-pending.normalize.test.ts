import { afterEach, describe, expect, it, jest } from '@jest/globals';
import type {
  PendingActionWire,
  PendingActWire,
  WalletActionsWireResponse,
} from './wallet-get-actions';
import {
  PENDING_ACTION_STATUSES,
  normalizePendingList,
  normalizePendingLists,
} from './wallet-get-actions-pending.normalize';

const ADDRESS = '0x42b9df65b219b3dd36ff330a4dd8f327a6ada990';
const EVM_ID = '1dc19f7a522218f977a4042dad63914c';
const SOLANA_ID = 'fa73dbdd-1ded-4da4-b346-8ef9c178d9e0';
const SPEC_EXAMPLE_ID = '0b5e1c7d9a2f4e6b8c3d5f7a9e1b3c5d';

const ethereum = {
  id: 'ethereum',
  name: 'Ethereum',
  iconUrl: 'https://chain-icons.s3.amazonaws.com/ethereum.png',
};

type IdCase = 'absent' | '' | typeof EVM_ID | typeof SOLANA_ID;

// Side-list row shape per zpi-ref#240 @cb02d4ec2 (PendingAction.yaml, PendingAct.yaml): status null, act status '', key `id`.
function row({
  id = EVM_ID,
  status = null,
  timestamp = 1759752000,
  extra = {},
}: {
  id?: IdCase | string;
  status?: string | null;
  timestamp?: number;
  extra?: Partial<PendingActionWire>;
}): PendingActionWire {
  const wire: PendingActionWire = {
    address: ADDRESS,
    id: id === 'absent' ? '' : id,
    timestamp,
    status,
    type: { value: 'trade', displayValue: 'Trade' },
    label: null,
    fee: null,
    refund: null,
    transaction: null,
    acts: [
      {
        type: { value: 'trade', displayValue: 'Trade' },
        label: null,
        content: { transfers: null, approvals: null },
        rate: null,
        status: '',
        transaction: { chain: ethereum, hash: '', explorerUrl: null },
      },
    ],
    content: { transfers: null, approvals: null },
    ...extra,
  };
  if (id === 'absent') {
    const withoutId: Partial<PendingActionWire> = { ...wire };
    delete withoutId.id;
    return withoutId as PendingActionWire;
  }
  return wire;
}

const ID_CASES: [IdCase, boolean][] = [
  ['absent', false],
  ['', false],
  [EVM_ID, true],
  [SOLANA_ID, true],
];

const STATUS_CASES: (string | null)[] = [
  null,
  '',
  'pending',
  'unsigned',
  'confirmed',
  'failed',
];

const CROSS = PENDING_ACTION_STATUSES.flatMap((list) =>
  ID_CASES.flatMap(([id, hasId]) =>
    STATUS_CASES.map((status) => [list, id, status, hasId] as const)
  )
);

describe('normalizePendingList', () => {
  it.each(CROSS)('list %j: id %j, status %j', (list, id, status, hasId) => {
    const input = row({ id, status });
    if (id === 'absent') {
      expect(input).not.toHaveProperty('id');
    }
    const result = normalizePendingList([input], list);
    if (hasId && (status === null || status === '' || status === list)) {
      expect(result).toHaveLength(1);
      expect(result[0].pendingActionId).toBe(id);
      expect(result[0].id).toBe(id);
      expect(result[0].status).toBe(list);
    } else {
      expect(result).toEqual([]);
    }
  });

  it.each(PENDING_ACTION_STATUSES)(
    'list %j: converts timestamps to ms and copies every other field',
    (list) => {
      const input = row({
        id: SPEC_EXAMPLE_ID,
        extra: { availableAt: 1759755600, expiresAt: 1759838400 },
      });
      const [item] = normalizePendingList([input], list);
      expect(item).not.toBe(input);
      expect(item).toStrictEqual({
        ...input,
        status: list,
        pendingActionId: SPEC_EXAMPLE_ID,
        timestamp: 1759752000000,
        availableAt: 1759755600000,
        expiresAt: 1759838400000,
      });
      expect(item.acts[0].status).toBe('');
      expect(item.acts[0].transaction.hash).toBe('');
      expect(item.acts[0].transaction.explorerUrl).toBeNull();
      expect(input.timestamp).toBe(1759752000);
      expect(input.status).toBeNull();
    }
  );

  it.each<[string, Partial<PendingActionWire>, number | null]>([
    ['absent', {}, null],
    ['null', { availableAt: null, expiresAt: null }, null],
    ['0', { availableAt: 0, expiresAt: 0 }, 0],
  ])('availableAt/expiresAt %s on the wire become %j', (_, extra, expected) => {
    const [item] = normalizePendingList([row({ extra })], 'unsigned');
    expect(item.availableAt).toBe(expected);
    expect(item.expiresAt).toBe(expected);
  });

  it('preserves input order and drops non-matching rows in place', () => {
    const [A, B, C, D] = [
      'ac7aeb32a72e674958a01ab69bd3ecae',
      '417b9b9af62d132b05e315720a9d7529',
      'a2ba206a118124d2337674f0661ef0d9',
      '0e19bdbb97c8f344e93dc47daff59502',
    ];
    const rows = [
      row({ id: A, timestamp: 3 }),
      row({ id: B, status: 'confirmed', timestamp: 9 }),
      row({ id: C, status: '', timestamp: 1 }),
      row({ id: '', timestamp: 8 }),
      row({ id: D, status: 'pending', timestamp: 2 }),
    ];
    expect(
      normalizePendingList(rows, 'pending').map((item) => [
        item.pendingActionId,
        item.timestamp,
      ])
    ).toEqual([
      [A, 3000],
      [C, 1000],
      [D, 2000],
    ]);
  });

  it.each(PENDING_ACTION_STATUSES)(
    'list %j: null, undefined and [] give []',
    (list) => {
      expect(normalizePendingList(null, list)).toStrictEqual([]);
      expect(normalizePendingList(undefined, list)).toStrictEqual([]);
      expect(normalizePendingList([], list)).toStrictEqual([]);
    }
  );

  const meta = { pagination: { cursor: 'next' } };
  it.each<[string, WalletActionsWireResponse]>([
    ['cursor page, both keys absent', { data: [], meta }],
    [
      'groups not loaded, both null',
      { data: [], meta, pending: null, unsigned: null },
    ],
    ['no groups, both empty', { data: [], meta, pending: [], unsigned: [] }],
  ])('%s: pending and unsigned both give []', (_, response) => {
    expect(normalizePendingList(response.pending, 'pending')).toStrictEqual([]);
    expect(normalizePendingList(response.unsigned, 'unsigned')).toStrictEqual(
      []
    );
  });

  it('keeps a present act status and fills only an absent one', () => {
    const [act] = row({}).acts;
    const actWithoutStatus = { ...act };
    delete actWithoutStatus.status;
    const [item] = normalizePendingList(
      [
        row({
          extra: {
            acts: [{ ...act, status: 'pending' }, actWithoutStatus],
          },
        }),
      ],
      'pending'
    );
    expect(item.acts.map((normalized) => normalized.status)).toStrictEqual([
      'pending',
      '',
    ]);
  });
});

// Row per zpi-ref#241 @d44cdb7d7 PendingAction.yaml / PendingAct.yaml: every required field, the spec's example values where it gives one, and no `status` on the row or its acts.
const SPEC_ROW = {
  address: '0x42b9df65b219b3dd36ff330a4dd8f327a6ada990',
  id: '0b5e1c7d9a2f4e6b8c3d5f7a9e1b3c5d',
  timestamp: 1791291600,
  type: { value: 'trade', displayValue: 'Trade' },
  label: null,
  fee: null,
  refund: null,
  content: { transfers: null, approvals: null },
  transaction: null,
  acts: [
    {
      type: { value: 'trade', displayValue: 'Trade' },
      label: null,
      content: { transfers: null, approvals: null },
      rate: null,
      transaction: {
        chain: {
          id: 'ethereum',
          name: 'Ethereum',
          iconUrl: 'https://example.com/icon.png',
          testnet: false,
        },
        hash: '',
        explorerUrl: null,
      },
    },
  ],
  availableAt: 1791295200,
  expiresAt: 1791298800,
};

const base = {
  id: 'base',
  name: 'Base',
  iconUrl: 'https://chain-icons.s3.amazonaws.com/base.png',
};

function actsWithoutTransaction(
  missing: 'absent' | 'null',
  transactions: (PendingActWire['transaction'] | 'missing')[]
): PendingActionWire {
  const [template] = row({}).acts;
  return row({
    extra: {
      acts: transactions.map((transaction) => {
        if (transaction !== 'missing') {
          return { ...template, transaction };
        }
        if (missing === 'null') {
          return { ...template, transaction: null };
        }
        const act: PendingActWire = { ...template };
        delete act.transaction;
        return act;
      }),
    },
  });
}

describe('normalizePendingList, an act without a transaction', () => {
  const broadcast = {
    chain: ethereum,
    hash: '0x5f2c',
    explorerUrl: 'https://etherscan.io/tx/0x5f2c',
  };
  const unbroadcastOnBase = { chain: base, hash: '', explorerUrl: null };

  it.each(['absent', 'null'] as const)(
    'transaction %s on act 2: act 2 gets an empty hash, no explorerUrl and act 1 chain',
    (missing) => {
      const input = actsWithoutTransaction(missing, [broadcast, 'missing']);
      if (missing === 'absent') {
        expect(input.acts[1]).not.toHaveProperty('transaction');
      } else {
        expect(input.acts[1].transaction).toBeNull();
      }
      const [item] = normalizePendingList([input], 'pending');
      expect(item.acts.map((act) => act.transaction)).toStrictEqual([
        broadcast,
        { chain: ethereum, hash: '', explorerUrl: null },
      ]);
    }
  );

  it.each(['absent', 'null'] as const)(
    'transaction %s on act 1: act 1 takes the chain of the first act that has one',
    (missing) => {
      const [item] = normalizePendingList(
        [
          actsWithoutTransaction(missing, [
            'missing',
            unbroadcastOnBase,
            broadcast,
          ]),
        ],
        'unsigned'
      );
      expect(item.acts.map((act) => act.transaction)).toStrictEqual([
        { chain: base, hash: '', explorerUrl: null },
        unbroadcastOnBase,
        broadcast,
      ]);
    }
  );

  it('hash null (zpi#357, WLT-2923): the act keeps its chain and gets an empty hash', () => {
    const [item] = normalizePendingList(
      [
        actsWithoutTransaction('null', [
          { chain: base, hash: null, explorerUrl: null },
          broadcast,
        ]),
      ],
      'unsigned'
    );
    expect(item.acts.map((act) => act.transaction)).toStrictEqual([
      unbroadcastOnBase,
      broadcast,
    ]);
  });

  it.each(['absent', 'null'] as const)(
    'transaction %s on every act: the row is kept with a chain NetworkIcon draws as its fallback tile',
    (missing) => {
      const input = actsWithoutTransaction(missing, ['missing', 'missing']);
      const result = normalizePendingList([input], 'unsigned');
      expect(result).toHaveLength(1);
      expect(result[0].pendingActionId).toBe(EVM_ID);
      expect(result[0].acts.map((act) => act.transaction)).toStrictEqual([
        {
          chain: { id: '', name: '', iconUrl: null },
          hash: '',
          explorerUrl: null,
        },
        {
          chain: { id: '', name: '', iconUrl: null },
          hash: '',
          explorerUrl: null,
        },
      ]);
    }
  );
});

describe('normalizePendingList, revision 2 of the contract (zpi-ref#241)', () => {
  it.each(PENDING_ACTION_STATUSES)(
    'list %j keeps the spec row, which has no status, under its opaque id',
    (list) => {
      expect(SPEC_ROW).not.toHaveProperty('status');
      expect(SPEC_ROW.acts[0]).not.toHaveProperty('status');
      const result = normalizePendingList(
        [SPEC_ROW as unknown as PendingActionWire],
        list
      );
      expect(result).toHaveLength(1);
      expect(result[0].status).toBe(list);
      expect(result[0].pendingActionId).toBe(SPEC_EXAMPLE_ID);
      expect(result[0].id).toBe(SPEC_EXAMPLE_ID);
      expect(result[0].acts.map((act) => act.status)).toStrictEqual(['']);
    }
  );

  it.each(PENDING_ACTION_STATUSES)(
    'list %j normalizes the spec row exactly like its revision-1 shape',
    (list) => {
      const revision1 = {
        ...SPEC_ROW,
        status: null,
        acts: SPEC_ROW.acts.map((act) => ({ ...act, status: '' })),
      };
      expect(
        normalizePendingList([SPEC_ROW as unknown as PendingActionWire], list)
      ).toStrictEqual(
        normalizePendingList([revision1 as unknown as PendingActionWire], list)
      );
    }
  );
});

describe('normalizePendingList, a row without an acts array', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  const [KEPT_BEFORE, MALFORMED, KEPT_AFTER] = [
    '6d1f3b7e2a9c4058b1e2f3a4c5d6e7f8',
    'c3a9e1d5b7f2408693a1b2c3d4e5f6a7',
    '9e8d7c6b5a4f43e2a1b0c9d8e7f6a5b4',
  ];

  it.each<[string, unknown]>([
    ['absent', 'absent'],
    ['null', null],
    ['an object', {}],
  ])('acts %s: the row is dropped and logged, its siblings kept', (_, acts) => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const malformed = row({ id: MALFORMED }) as Partial<PendingActionWire>;
    if (acts === 'absent') {
      delete malformed.acts;
    } else {
      (malformed as Record<string, unknown>).acts = acts;
    }
    const result = normalizePendingList(
      [
        row({ id: KEPT_BEFORE }),
        malformed as PendingActionWire,
        row({ id: KEPT_AFTER }),
      ],
      'pending'
    );
    expect(result.map((item) => item.pendingActionId)).toStrictEqual([
      KEPT_BEFORE,
      KEPT_AFTER,
    ]);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0][0]).toContain(MALFORMED);
  });
});

describe('normalizePendingLists', () => {
  it.each<
    [string, Pick<WalletActionsWireResponse, 'pending' | 'unsigned'>, boolean]
  >([
    ['both absent', {}, false],
    ['both null', { pending: null, unsigned: null }, false],
    ['both present', { pending: [row({})], unsigned: [] }, true],
  ])('%s: pendingListsAvailable is %j', (_, wire, available) => {
    const result = normalizePendingLists(wire);
    expect(result.pendingListsAvailable).toBe(available);
    expect(result.pending).toHaveLength(wire.pending ? 1 : 0);
    expect(result.unsigned).toStrictEqual([]);
  });
});
