import { describe, expect, it } from '@jest/globals';
import type { LocalAddressAction } from 'src/modules/ethereum/transactions/addressAction';
import type {
  ActionChain,
  ActionStatus,
  AddressAction,
  PendingActionStatus,
  PendingActionWire,
} from 'src/modules/zerion-api/requests/wallet-get-actions';
import { normalizePendingList } from 'src/modules/zerion-api/requests/wallet-get-actions-pending.normalize';
import type { Fungible } from 'src/modules/zerion-api/types/Fungible';
import { filterLocalByAssetTypes } from 'src/ui/features/pending-transactions/getLocalPendingActions';
import { getEntryKey } from 'src/ui/features/pending-transactions/mergePendingEntries';
import { mergeHistoryActions } from './mergeHistoryActions';

const ADDRESS = '0x42b9df65b219b3dd36ff330a4dd8f327a6ada990';
// 2026-10-20T14:00:00Z
const T0_MS = 1792504800000;
const minutes = (n: number) => T0_MS + n * 60_000;

const base: ActionChain = { id: 'base', name: 'Base', iconUrl: null };
const hash = (digit: string) => `0x${digit.repeat(64)}`;

const USDC = { id: 'usdc', symbol: 'USDC', name: 'USD Coin' } as Fungible;

type Content = AddressAction['content'];
const NO_CONTENT: Content = { transfers: null, approvals: null };
const FUNGIBLE_TRANSFER: Content = {
  transfers: [
    {
      direction: 'out',
      fungible: USDC,
      nft: null,
      amount: { quantity: '1', value: 1, usdValue: 1, currency: 'usd' },
    },
  ],
  approvals: null,
} as unknown as Content;
const FUNGIBLE_APPROVAL: Content = {
  transfers: null,
  approvals: [{ fungible: USDC, nft: null, collection: null, unlimited: true }],
} as unknown as Content;
const NFT_TRANSFER: Content = {
  transfers: [{ direction: 'out', fungible: null, nft: { tokenId: '1' } }],
  approvals: null,
} as unknown as Content;

function local({
  id,
  timestampMs,
  status = 'pending',
  actContents = [NO_CONTENT],
}: {
  id: string;
  timestampMs: number;
  status?: ActionStatus;
  actContents?: Content[];
}): LocalAddressAction {
  const transaction = { chain: base, hash: id, explorerUrl: null };
  return {
    id,
    address: ADDRESS,
    timestamp: timestampMs,
    status,
    type: { value: 'send', displayValue: 'Send' },
    label: null,
    fee: null,
    refund: null,
    content: null,
    transaction,
    acts: actContents.map((content) => ({
      type: { value: 'send', displayValue: 'Send' },
      label: null,
      content,
      rate: null,
      status,
      transaction,
    })),
    rawTransaction: null,
    local: true,
  };
}

function indexed(id: string, timestampMs: number): AddressAction {
  const transaction = { chain: base, hash: id, explorerUrl: null };
  return {
    id,
    address: ADDRESS,
    timestamp: timestampMs,
    status: 'confirmed',
    type: { value: 'receive', displayValue: 'Receive' },
    label: null,
    fee: null,
    refund: null,
    content: null,
    transaction,
    acts: [
      {
        type: { value: 'receive', displayValue: 'Receive' },
        label: null,
        content: NO_CONTENT,
        rate: null,
        status: 'confirmed',
        transaction,
      },
    ],
  };
}

// Wire row shape per zpi-ref main PendingAction.yaml / PendingAct.yaml.
function remote(
  list: PendingActionStatus,
  id: string,
  timestampMs: number,
  acts: PendingActionWire['acts'] = [
    {
      type: { value: 'trade', displayValue: 'Trade' },
      label: null,
      content: NO_CONTENT,
      rate: null,
      status: '',
      transaction: { chain: base, hash: '', explorerUrl: null },
    },
  ]
) {
  const [row] = normalizePendingList(
    [
      {
        address: ADDRESS,
        id,
        timestamp: timestampMs / 1000,
        status: null,
        type: { value: 'trade', displayValue: 'Trade' },
        label: null,
        fee: null,
        refund: null,
        content: NO_CONTENT,
        transaction: null,
        acts,
      },
    ],
    list
  );
  return row;
}

const NONE = new Set<string>();

function merge(
  input: Partial<Parameters<typeof mergeHistoryActions>[0]> & {
    local: LocalAddressAction[];
  }
) {
  return mergeHistoryActions({
    actions: [],
    pending: [],
    unsigned: [],
    hiddenIds: NONE,
    filters: {},
    contentFiltered: false,
    ...input,
  });
}

function rowIds(result: ReturnType<typeof merge>) {
  return [
    ...result.pending.map(getEntryKey),
    ...result.history.map((row) => row.id),
  ];
}

describe('WLT-1724 rules for local rows (AC3)', () => {
  const newest = indexed(hash('9'), minutes(30));

  it('a pending local row older than the newest backend action stays', () => {
    const row = local({ id: hash('1'), timestampMs: minutes(0) });
    expect(rowIds(merge({ local: [row], actions: [newest] }))).toEqual([
      `local:${row.id}`,
      newest.id,
    ]);
    expect(
      rowIds(merge({ local: [row], actions: [newest], contentFiltered: true }))
    ).toEqual([`local:${row.id}`, newest.id]);
  });

  it('counter-case: the same row once mined is hidden by the newer backend action', () => {
    const row = local({
      id: hash('1'),
      timestampMs: minutes(0),
      status: 'confirmed',
    });
    expect(rowIds(merge({ local: [row], actions: [newest] }))).toEqual([
      newest.id,
    ]);
    const newer = { ...row, timestamp: minutes(40) };
    expect(rowIds(merge({ local: [newer], actions: [newest] }))).toEqual([
      newer.id,
      newest.id,
    ]);
  });

  it.each([
    ['a fungible transfer in a later act', [NO_CONTENT, FUNGIBLE_TRANSFER]],
    ['a fungible approval', [FUNGIBLE_APPROVAL]],
  ])(
    "with assetTypes ['fungible'], a row with %s stays",
    (_name, actContents) => {
      const row = local({
        id: hash('2'),
        timestampMs: minutes(40),
        actContents,
      });
      const filtered = filterLocalByAssetTypes([row], ['fungible']);
      expect(rowIds(merge({ local: filtered, contentFiltered: true }))).toEqual(
        [`local:${row.id}`]
      );
    }
  );

  it.each([
    ['no content', [NO_CONTENT]],
    ['only an NFT transfer', [NFT_TRANSFER, NO_CONTENT]],
  ])(
    "counter-case: with assetTypes ['fungible'], a row with %s is dropped",
    (_name, actContents) => {
      const row = local({
        id: hash('3'),
        timestampMs: minutes(40),
        actContents,
      });
      expect(filterLocalByAssetTypes([row], ['fungible'])).toEqual([]);
      expect(filterLocalByAssetTypes([row], undefined)).toEqual([row]);
      expect(filterLocalByAssetTypes([row], ['fungible', 'nft'])).toEqual([
        row,
      ]);
    }
  );
});

describe('row order and hidden ids (AC4)', () => {
  it('unsigned, then backend and local pending by time, then indexed; hidden ids never render', () => {
    const unsignedOld = remote('unsigned', 'unsigned-old', minutes(1));
    const unsignedNew = remote('unsigned', 'unsigned-new', minutes(9));
    const unsignedHidden = remote('unsigned', 'unsigned-hidden', minutes(10));
    const pendingNew = remote('pending', 'pending-new', minutes(8));
    const pendingOld = remote('pending', 'pending-old', minutes(5));
    const pendingHidden = remote('pending', 'pending-hidden', minutes(7));
    const localPending = local({ id: hash('6'), timestampMs: minutes(6) });
    const localMined = local({
      id: hash('7'),
      timestampMs: minutes(4),
      status: 'confirmed',
    });
    const indexedNew = indexed(hash('8'), minutes(3));
    const indexedOld = indexed(hash('9'), minutes(2));

    const result = merge({
      local: [localMined, localPending],
      actions: [indexedNew, indexedOld],
      pending: [pendingOld, pendingHidden, pendingNew],
      unsigned: [unsignedOld, unsignedHidden, unsignedNew],
      hiddenIds: new Set(['unsigned-hidden', 'pending-hidden']),
    });

    expect(rowIds(result)).toEqual([
      'remote:unsigned-new',
      'remote:unsigned-old',
      'remote:pending-new',
      `local:${localPending.id}`,
      'remote:pending-old',
      localMined.id,
      indexedNew.id,
      indexedOld.id,
    ]);
  });
});

describe('rows with missing transaction data merge without throwing (AC5)', () => {
  it('a row with an empty act hash', () => {
    const emptyHash = remote('pending', 'empty-hash', minutes(2));
    expect(emptyHash.acts[0].transaction.hash).toBe('');
    const row = local({ id: hash('1'), timestampMs: minutes(1) });
    expect(rowIds(merge({ local: [row], pending: [emptyHash] }))).toEqual([
      'remote:empty-hash',
      `local:${row.id}`,
    ]);
  });

  it('a row whose act had no transaction', () => {
    const noTransaction = remote('unsigned', 'no-transaction', minutes(2), [
      {
        type: { value: 'trade', displayValue: 'Trade' },
        label: null,
        content: NO_CONTENT,
        rate: null,
        transaction: null,
      },
    ]);
    const row = local({ id: hash('1'), timestampMs: minutes(1) });
    const brokenLocal = {
      ...local({ id: hash('2'), timestampMs: minutes(3) }),
      transaction: null,
      acts: [
        {
          ...local({ id: hash('2'), timestampMs: 0 }).acts![0],
          transaction: undefined,
        },
      ],
    } as unknown as LocalAddressAction;
    expect(
      rowIds(merge({ local: [row, brokenLocal], unsigned: [noTransaction] }))
    ).toEqual([
      'remote:no-transaction',
      `local:${brokenLocal.id}`,
      `local:${row.id}`,
    ]);
  });

  it('a row without acts', () => {
    const noActs: LocalAddressAction = {
      ...local({ id: hash('4'), timestampMs: minutes(2) }),
      acts: null,
      transaction: null,
    };
    const indexedRow = indexed(hash('5'), minutes(1));
    expect(
      rowIds(
        merge({
          local: [noActs],
          actions: [{ ...indexedRow, acts: null }],
          pending: [remote('pending', 'no-acts', minutes(3), [])],
        })
      )
    ).toEqual(['remote:no-acts', `local:${noActs.id}`, indexedRow.id]);
  });
});
