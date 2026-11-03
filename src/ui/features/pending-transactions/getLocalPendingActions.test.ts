import { describe, expect, it } from '@jest/globals';
import type {
  AddressAction as Action,
  ActionChain,
  PendingAction,
} from 'src/modules/zerion-api/requests/wallet-get-actions';
import { normalizePendingLists } from 'src/modules/zerion-api/requests/wallet-get-actions-pending.normalize';
import { createFakePendingLists } from './fakePendingActions';
import { getLocalPendingActions } from './getLocalPendingActions';
import { mergePendingEntries } from './mergePendingEntries';

const ADDRESS = '0x42b9df65b219b3dd36ff330a4dd8f327a6ada990';
// WLT-3016: the Zama Claim signed from History.
const CLAIM_HASH =
  '0x37b77cd8656ce388f58785f5dc69ecbbd98a137fd5556a8be932d3494371411e';
const SWAP_HASH =
  '0x5c504ed432cb51138bcf09aa5e8a410dd4a1e204ef84bfed1be16dfba1b22060';
const SIGNED_MS = Date.parse('2026-10-20T14:09:04Z');
// A device clock 10 s ahead stamps the local row after the mined time, so only the hash match can clear it.
const MINED_MS = Date.parse('2026-10-20T14:09:11Z') - 10_000;
const OLDER_MINED_MS = Date.parse('2026-10-20T13:00:00Z');

const base: ActionChain = { id: 'base', name: 'Base', iconUrl: null };

function upper(hash: string) {
  return `0x${hash.slice(2).toUpperCase()}`;
}

// Mirrors web's createLocalActionFromPendingAction: the local row a History sign of `item` stores.
function createLocalActionFromPendingAction({
  item,
  hash,
  explorerUrl,
}: {
  item: PendingAction;
  hash: string;
  explorerUrl: string | null;
  chainWhenNoActs: ActionChain;
}): Omit<Action, 'timestamp'> {
  return {
    id: hash,
    address: item.address,
    status: 'pending',
    type: item.type,
    label: item.label,
    content: item.content,
    fee: item.fee,
    refund: item.refund,
    transaction: null,
    acts: item.acts.map((act) => ({
      type: act.type,
      label: act.label,
      content: act.content,
      rate: act.rate,
      status: 'pending',
      transaction: { chain: act.transaction.chain, hash, explorerUrl },
    })),
  };
}

function signedFromHistory(hash: string): Action {
  const [step] = normalizePendingLists(
    createFakePendingLists(ADDRESS, SIGNED_MS)
  ).unsigned;
  return {
    ...createLocalActionFromPendingAction({
      item: step,
      hash,
      explorerUrl: null,
      chainWhenNoActs: base,
    }),
    timestamp: SIGNED_MS,
  };
}

function walletSentSwap(hash: string): Action {
  return {
    id: hash,
    address: ADDRESS,
    timestamp: SIGNED_MS,
    status: 'pending',
    type: { value: 'trade', displayValue: 'Trade' },
    label: null,
    fee: null,
    refund: null,
    transaction: null,
    content: null,
    acts: [
      {
        type: { value: 'trade', displayValue: 'Trade' },
        label: null,
        content: { transfers: null, approvals: null },
        rate: null,
        status: 'pending',
        transaction: { chain: base, hash, explorerUrl: null },
      },
    ],
  };
}

function mined(local: Action, hash: string, timestamp: number): Action {
  return {
    ...local,
    id: `indexed-${hash}`,
    timestamp,
    status: 'confirmed',
    acts: (local.acts ?? []).map((act) => ({
      ...act,
      status: 'confirmed',
      transaction: { ...act.transaction, hash },
    })),
  };
}

function pendingEntries(local: Action, actions: Action[]) {
  return mergePendingEntries({
    local: getLocalPendingActions({
      localActions: [local],
      actions,
      pending: [],
      unsigned: [],
      contentFiltered: false,
    }),
    pending: [],
    unsigned: [],
    actions,
  });
}

describe('getLocalPendingActions: a mined action with the local hash clears Pending (WLT-3016 AC3)', () => {
  it.each([
    ['signed from History', signedFromHistory, CLAIM_HASH],
    ['a wallet-sent swap', walletSentSwap, SWAP_HASH],
  ] as [string, (hash: string) => Action, string][])(
    '%s',
    (_, createLocal, hash) => {
      const local = createLocal(upper(hash));
      const older = mined(
        walletSentSwap(`0x${'1'.repeat(64)}`),
        `0x${'1'.repeat(64)}`,
        OLDER_MINED_MS
      );

      expect(pendingEntries(local, [older])).toEqual([
        { kind: 'local', action: local },
      ]);

      const indexed = mined(local, hash, MINED_MS);
      expect(pendingEntries(local, [indexed, older])).toEqual([]);
    }
  );
});
