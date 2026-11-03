import { describe, expect, it } from '@jest/globals';
import type { PendingActionWire } from 'src/modules/zerion-api/requests/wallet-get-actions';
import { normalizePendingList } from 'src/modules/zerion-api/requests/wallet-get-actions-pending.normalize';
import { shouldShowHistoryTabDot } from './shouldShowHistoryTabDot';

const NOW_SECONDS = 1791295200;
const NOW_MS = NOW_SECONDS * 1000;

// Wire row shape per zpi-ref main PendingAction.yaml / PendingAct.yaml.
function unsignedRow(id: string, availableAt: number | null) {
  const wire: PendingActionWire = {
    address: '0x42b9df65b219b3dd36ff330a4dd8f327a6ada990',
    id,
    timestamp: NOW_SECONDS - 600,
    status: null,
    type: { value: 'send', displayValue: 'Send' },
    label: null,
    fee: null,
    refund: null,
    content: null,
    transaction: null,
    acts: [],
    availableAt,
  };
  return normalizePendingList([wire], 'unsigned')[0];
}

const SIGNABLE = [unsignedRow('ready', NOW_SECONDS - 60)];
const NOT_SIGNABLE = [
  unsignedRow('later', NOW_SECONDS + 3600),
  unsignedRow('unknown', null),
];

describe('History-tab dot (AC9)', () => {
  const cases = [true, false].flatMap((hasLocalPending) =>
    [true, false].flatMap((hasSignable) =>
      [false, true].map(
        (isWatchlist) =>
          [
            hasLocalPending ? 'a local pending tx' : 'no local pending tx',
            hasSignable ? 'a signable row' : 'no signable row',
            isWatchlist ? 'watchlist' : 'own',
            { hasLocalPending, hasSignable, isWatchlist },
            !isWatchlist && (hasLocalPending || hasSignable),
          ] as const
      )
    )
  );

  it('covers every combination once', () => {
    expect(cases).toHaveLength(8);
  });

  it.each(cases)(
    '%s, %s, %s wallet',
    (_local, _signable, _wallet, inputs, expected) => {
      expect(
        shouldShowHistoryTabDot({
          isWatchlist: inputs.isWatchlist,
          localPendingCount: inputs.hasLocalPending ? 1 : 0,
          unsigned: inputs.hasSignable
            ? [...NOT_SIGNABLE, ...SIGNABLE]
            : NOT_SIGNABLE,
          nowMs: NOW_MS,
        })
      ).toBe(expected);
    }
  );
});
