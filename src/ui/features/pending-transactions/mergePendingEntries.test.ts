import { describe, expect, it } from '@jest/globals';
import type {
  AddressAction as Action,
  ActionChain,
  ActionStatus,
  PendingAction,
  PendingActionStatus,
  PendingActionWire,
} from 'src/modules/zerion-api/requests/wallet-get-actions';
import { normalizePendingList } from 'src/modules/zerion-api/requests/wallet-get-actions-pending.normalize';
import {
  getEntryKey,
  isSameTxHash,
  matchesSearchQuery,
  mergePendingEntries,
} from './mergePendingEntries';

const ADDRESS = '0x42b9df65b219b3dd36ff330a4dd8f327a6ada990';

const ethereum: ActionChain = {
  id: 'ethereum',
  name: 'Ethereum',
  iconUrl: 'https://chain-icons.s3.amazonaws.com/ethereum.png',
};

const solana: ActionChain = {
  id: 'solana',
  name: 'Solana',
  iconUrl: 'https://chain-icons.s3.amazonaws.com/solana.png',
};

const EXPLORER_TX_URL: Record<string, string> = {
  ethereum: 'https://etherscan.io/tx/',
  solana: 'https://solscan.io/tx/',
};

const EVM_HASH =
  '0x5c504ed432cb51138bcf09aa5e8a410dd4a1e204ef84bfed1be16dfba1b22060';
const EVM_HASH_UPPER = `0x${EVM_HASH.slice(2).toUpperCase()}`;
const OTHER_EVM_HASH =
  '0x9fc76417374aa880d4449a1f7f31ec597f00b1f6f3dd2d66f4c9c6c445836d8b';
const SOLANA_SIGNATURE =
  '5VERv8NMvzbJMEkV8xnrLkEaWRtSz9CosKDYjCJjBRnbJLgp8uirBgmQpjKhoR4tjF3ZpRzrFmBV6UjKdiSZkQUW';

const RULE_ROW = 'b57c74a10d7de4ae7b753e5a03b23ff7';
const UNRELATED = '8186263dd140cc34dfbb91018d65314c';
const CARRIES_HASH = '242dba4787b66c4885b91a237de0cfda';
const EMPTY_HASH = '82e16f6879994d27e31070ce1458251f';
const UNSIGNED_WITH_HASH = '08843057814571d99a1adb437d917e04';
const PENDING_T4 = 'b89b81ff7d5af73c1ebdd63c003f9574';
const PENDING_T1 = '2e8937c43de593868d778a75411343b5';
const UNSIGNED_T2 = 'bbdd2cebb4ae4a32548b5912b0135852';
const UNSIGNED_T0 = 'e124b12b1e4052a14428100f3231bb0f';
const PENDING_SAME = '9f6d371579149142a3162f24233d1fd3';
const TIE_LOW = '2092f1e03bd3f8ec3de9e50f7524d7ab';
const TIE_HIGH = 'a759c2979f845733b06a3b9919892980';
const SOLANA_ID = 'df0b7054-19c0-4052-b4c8-38d684725905';

const T0 = 1759752000;
const t = (minutes: number) => T0 + minutes * 60;

function txOn(chain: ActionChain, hash: string) {
  return {
    chain,
    hash,
    explorerUrl: hash === '' ? null : `${EXPLORER_TX_URL[chain.id]}${hash}`,
  };
}

// Wire row per zpi-ref main @9bd9dc4f PendingAction.yaml, PendingAct.yaml and ActTransaction.yaml: it carries `transaction` and chain `testnet` and has no `gasback`, unlike the web `PendingActionWire` type.
function remote(
  list: PendingActionStatus,
  {
    id,
    seconds,
    hash,
    chain = ethereum,
  }: { id: string; seconds: number; hash: string | null; chain?: ActionChain }
): PendingAction {
  const content = { transfers: null, approvals: null };
  const type = { value: 'trade', displayValue: 'Trade' } as const;
  const transaction = {
    ...txOn({ ...chain, testnet: false } as ActionChain, hash ?? ''),
    hash,
  };
  const wire = {
    address: ADDRESS,
    id,
    timestamp: seconds,
    type,
    label: null,
    fee: null,
    refund: null,
    content,
    transaction,
    acts: [{ type, label: null, content, rate: null, status: '', transaction }],
    status: null,
  };
  const normalized = normalizePendingList(
    [wire as unknown as PendingActionWire],
    list
  );
  expect(normalized).toHaveLength(1);
  return normalized[0];
}

// Mirrors createPendingCliAction plus actionsStore.addLocalAction's ms timestamp.
function local({
  hash,
  seconds,
  chain = ethereum,
  status = 'pending',
}: {
  hash: string;
  seconds: number;
  chain?: ActionChain;
  status?: ActionStatus;
}): Action {
  const type = { value: 'send', displayValue: 'Send' } as const;
  return {
    id: hash,
    address: ADDRESS,
    timestamp: seconds * 1000,
    status,
    type,
    label: null,
    fee: null,
    refund: null,
    transaction: null,
    content: null,
    acts: [
      {
        type,
        label: null,
        content: { transfers: null, approvals: null },
        rate: null,
        status,
        transaction: txOn(chain, hash),
      },
    ],
  };
}

function keys(
  params: Omit<Parameters<typeof mergePendingEntries>[0], 'actions'>
) {
  return mergePendingEntries({ ...params, actions: undefined }).map(
    getEntryKey
  );
}

describe('mergePendingEntries', () => {
  describe('AC1: each drop rule has a fixture only it drops', () => {
    it('rule 1 drops a local action whose hash a remote item carries', () => {
      expect(
        keys({
          local: [local({ hash: EVM_HASH, seconds: t(2) })],
          pending: [
            remote('pending', {
              id: RULE_ROW,
              seconds: t(0),
              hash: EVM_HASH,
            }),
          ],
          unsigned: [],
        })
      ).toEqual([`remote:${RULE_ROW}`]);
    });

    it('rule 2 drops a local action the search excludes', () => {
      const searchQuery = 'trade ethereum';
      const item = remote('pending', {
        id: RULE_ROW,
        seconds: t(0),
        hash: OTHER_EVM_HASH,
      });
      expect(matchesSearchQuery(searchQuery, item)).toBe(true);
      expect(
        keys({
          local: [local({ hash: EVM_HASH, seconds: t(2) })],
          pending: [item],
          unsigned: [],
          searchQuery,
        })
      ).toEqual([`remote:${RULE_ROW}`]);
    });
  });

  describe('AC2: a local action is dropped exactly when a remote carries its hash or the search excludes it', () => {
    const SEARCH_MATCHING_LOCAL_ONLY = 'send';
    const localAction = (status: ActionStatus = 'pending') =>
      local({ hash: EVM_HASH, seconds: t(2), status });
    const unrelated = () =>
      remote('pending', {
        id: UNRELATED,
        seconds: t(0),
        hash: OTHER_EVM_HASH,
      });
    const carriesHashUpToCase = () =>
      remote('pending', {
        id: CARRIES_HASH,
        seconds: t(0),
        hash: EVM_HASH_UPPER,
      });
    const emptyHash = () =>
      remote('pending', { id: EMPTY_HASH, seconds: t(0), hash: '' });

    it.each<
      [
        string,
        string | undefined,
        () => {
          local: Action[];
          pending: PendingAction[];
          unsigned: PendingAction[];
        },
        string[]
      ]
    >([
      [
        'no remote with its hash',
        undefined,
        () => ({
          local: [localAction()],
          pending: [unrelated()],
          unsigned: [],
        }),
        ['local:' + EVM_HASH, `remote:${UNRELATED}`],
      ],
      [
        'no remote with its hash',
        SEARCH_MATCHING_LOCAL_ONLY,
        () => ({
          local: [localAction()],
          pending: [unrelated()],
          unsigned: [],
        }),
        ['local:' + EVM_HASH, `remote:${UNRELATED}`],
      ],
      [
        'a pending remote with its hash up to 0x case',
        undefined,
        () => ({
          local: [localAction()],
          pending: [carriesHashUpToCase()],
          unsigned: [],
        }),
        [`remote:${CARRIES_HASH}`],
      ],
      [
        'a pending remote with its hash up to 0x case',
        SEARCH_MATCHING_LOCAL_ONLY,
        () => ({
          local: [localAction()],
          pending: [carriesHashUpToCase()],
          unsigned: [],
        }),
        [`remote:${CARRIES_HASH}`],
      ],
      [
        'a remote whose only act hash is empty',
        undefined,
        () => ({
          local: [localAction()],
          pending: [emptyHash()],
          unsigned: [],
        }),
        ['local:' + EVM_HASH, `remote:${EMPTY_HASH}`],
      ],
      [
        'a remote whose only act hash is empty',
        SEARCH_MATCHING_LOCAL_ONLY,
        () => ({
          local: [localAction()],
          pending: [emptyHash()],
          unsigned: [],
        }),
        ['local:' + EVM_HASH, `remote:${EMPTY_HASH}`],
      ],
      [
        'an unsigned remote with its hash',
        undefined,
        () => ({
          local: [localAction()],
          pending: [],
          unsigned: [
            remote('unsigned', {
              id: UNSIGNED_WITH_HASH,
              seconds: t(0),
              hash: EVM_HASH,
            }),
          ],
        }),
        [`remote:${UNSIGNED_WITH_HASH}`],
      ],
      [
        'a pending remote with its hash, local confirmed',
        undefined,
        () => ({
          local: [localAction('confirmed')],
          pending: [carriesHashUpToCase()],
          unsigned: [],
        }),
        [`remote:${CARRIES_HASH}`],
      ],
      [
        'a pending remote with its hash, local failed',
        undefined,
        () => ({
          local: [localAction('failed')],
          pending: [carriesHashUpToCase()],
          unsigned: [],
        }),
        [`remote:${CARRIES_HASH}`],
      ],
    ])('%s, search %j', (_, searchQuery, build, expected) => {
      const input = build();
      if (searchQuery) {
        expect(matchesSearchQuery(searchQuery, input.local[0])).toBe(true);
        for (const item of [...input.pending, ...input.unsigned]) {
          expect(matchesSearchQuery(searchQuery, item)).toBe(false);
        }
      }
      expect(keys({ ...input, searchQuery })).toEqual(expected);
    });
  });

  describe('AC3: isSameTxHash', () => {
    it('is case-insensitive for 0x hashes, exact otherwise, and never matches an empty string', () => {
      expect(isSameTxHash('0xAbC', '0xabc')).toBe(true);
      expect(isSameTxHash(SOLANA_SIGNATURE, SOLANA_SIGNATURE)).toBe(true);
      expect(
        isSameTxHash(SOLANA_SIGNATURE, `5v${SOLANA_SIGNATURE.slice(2)}`)
      ).toBe(false);
      expect(isSameTxHash('0xabc', 'abc')).toBe(false);
      expect(isSameTxHash('', '')).toBe(false);
      expect(isSameTxHash('', '0xabc')).toBe(false);
    });
  });

  describe('WLT-2942: a missing hash never matches and never throws', () => {
    const MISSING = [null, undefined, ''] as const;
    type Missing = (typeof MISSING)[number];

    function withActHash<T extends Action | PendingAction>(
      entry: T,
      hash: Missing
    ): T {
      const acts = entry.acts as NonNullable<Action['acts']>;
      return {
        ...entry,
        acts: acts.map((act) => ({
          ...act,
          transaction: { ...act.transaction, hash: hash as string },
        })),
      };
    }

    it.each(MISSING)(
      'isSameTxHash(%j, x) on either or both sides is false',
      (missing) => {
        expect(isSameTxHash(missing, EVM_HASH)).toBe(false);
        expect(isSameTxHash(EVM_HASH, missing)).toBe(false);
        expect(isSameTxHash(missing, missing)).toBe(false);
      }
    );

    it.each(
      MISSING.flatMap((localHash) =>
        MISSING.map((remoteHash) => [localHash, remoteHash] as const)
      )
    )(
      'local act hash %j with remote act hash %j keeps every row',
      (localHash, remoteHash) => {
        const missingLocal = withActHash(
          local({ hash: EMPTY_HASH, seconds: t(5) }),
          localHash
        );
        expect(
          keys({
            local: [missingLocal, local({ hash: EVM_HASH, seconds: t(3) })],
            pending: [
              withActHash(
                remote('pending', { id: PENDING_T1, seconds: t(1), hash: '' }),
                remoteHash
              ),
            ],
            unsigned: [
              withActHash(
                remote('unsigned', {
                  id: UNSIGNED_T0,
                  seconds: t(0),
                  hash: '',
                }),
                remoteHash
              ),
            ],
          })
        ).toEqual([
          `remote:${UNSIGNED_T0}`,
          `local:${EMPTY_HASH}`,
          `local:${EVM_HASH}`,
          `remote:${PENDING_T1}`,
        ]);
      }
    );

    it('the reported crash: a wire act with hash null (zpi#357) next to a local swap row with a null act hash', () => {
      const unsigned = remote('unsigned', {
        id: UNSIGNED_T0,
        seconds: t(0),
        hash: null,
      });
      expect(unsigned.acts[0].transaction.hash).toBe('');
      expect(
        keys({
          local: [
            withActHash(local({ hash: EMPTY_HASH, seconds: t(5) }), null),
            local({ hash: EVM_HASH, seconds: t(3) }),
          ],
          pending: [
            remote('pending', { id: PENDING_T1, seconds: t(1), hash: null }),
            remote('pending', {
              id: PENDING_T4,
              seconds: t(4),
              hash: EVM_HASH,
            }),
          ],
          unsigned: [unsigned],
        })
      ).toEqual([
        `remote:${UNSIGNED_T0}`,
        `local:${EMPTY_HASH}`,
        `remote:${PENDING_T4}`,
        `remote:${PENDING_T1}`,
      ]);
    });
  });

  describe('AC4: unsigned first, then pending and local interleaved, each by timestamp descending', () => {
    it('(a) sorts an older unsigned item above a newer pending item and a newer local action', () => {
      expect(
        keys({
          pending: [
            remote('pending', {
              id: PENDING_T4,
              seconds: t(4),
              hash: OTHER_EVM_HASH,
            }),
            remote('pending', { id: PENDING_T1, seconds: t(1), hash: '' }),
          ],
          local: [local({ hash: EVM_HASH, seconds: t(3) })],
          unsigned: [
            remote('unsigned', { id: UNSIGNED_T2, seconds: t(2), hash: '' }),
            remote('unsigned', { id: UNSIGNED_T0, seconds: t(0), hash: '' }),
          ],
        })
      ).toEqual([
        `remote:${UNSIGNED_T2}`,
        `remote:${UNSIGNED_T0}`,
        `remote:${PENDING_T4}`,
        `local:${EVM_HASH}`,
        `remote:${PENDING_T1}`,
      ]);
    });

    it('(b) puts a remote pending item before a local action at the same timestamp', () => {
      expect(
        keys({
          local: [local({ hash: EVM_HASH, seconds: t(1) })],
          pending: [
            remote('pending', {
              id: PENDING_SAME,
              seconds: t(1),
              hash: OTHER_EVM_HASH,
            }),
          ],
          unsigned: [],
        })
      ).toEqual([`remote:${PENDING_SAME}`, `local:${EVM_HASH}`]);
    });

    it('(c) orders two unsigned items at the same timestamp by entry key ascending', () => {
      expect(
        keys({
          local: [],
          pending: [],
          unsigned: [
            remote('unsigned', {
              id: TIE_HIGH,
              seconds: t(1),
              hash: '',
            }),
            remote('unsigned', {
              id: TIE_LOW,
              seconds: t(1),
              hash: '',
            }),
          ],
        })
      ).toEqual([`remote:${TIE_LOW}`, `remote:${TIE_HIGH}`]);
    });
  });

  describe('AC5: the sign hand-over renders step S exactly once at each stage', () => {
    const S = '0b5e1c7d9a2f4e6b8c3d5f7a9e1b3c5d';

    it('(a) right after the broadcast: S unsigned without a hash, local action with H', () => {
      expect(
        keys({
          unsigned: [remote('unsigned', { id: S, seconds: t(0), hash: '' })],
          pending: [],
          local: [local({ hash: EVM_HASH, seconds: t(5) })],
        })
      ).toEqual([`remote:${S}`, `local:${EVM_HASH}`]);
    });

    it.each([
      [
        'EVM, hash differing in 0x letter case',
        S,
        ethereum,
        EVM_HASH_UPPER,
        EVM_HASH,
      ],
      [
        'Solana, exact base58 signature',
        SOLANA_ID,
        solana,
        SOLANA_SIGNATURE,
        SOLANA_SIGNATURE,
      ],
    ])(
      '(b) next refetch: S pending with H (%s), local still holds H',
      (_, id, chain, remoteHash, localHash) => {
        expect(
          keys({
            unsigned: [],
            pending: [
              remote('pending', {
                id,
                seconds: t(0),
                hash: remoteHash,
                chain,
              }),
            ],
            local: [local({ hash: localHash, seconds: t(5), chain })],
          })
        ).toEqual([`remote:${id}`]);
      }
    );

    it('(c) H mined and indexed: S left both lists, local action confirmed', () => {
      expect(
        keys({
          unsigned: [],
          pending: [],
          local: [
            local({ hash: EVM_HASH, seconds: t(5), status: 'confirmed' }),
          ],
        })
      ).toEqual([`local:${EVM_HASH}`]);
    });
  });
});
