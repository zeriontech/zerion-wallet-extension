import { describe, expect, test } from '@jest/globals';
import type { ToasterView } from '../types';
import type { TerminalKind } from './useToasterSession';
import {
  HISTORY_PATH,
  getSubtitle,
  getTerminalAction,
  getTitle,
} from './toasterCopy';

const bridge: ToasterView = {
  kind: 'bridge',
  explorerUrlTemplate: null,
  sent: { symbol: 'USDC', iconUrl: null },
  received: { symbol: 'USDC', iconUrl: null },
  receivedChain: { iconUrl: null },
};
const swap: ToasterView = {
  ...bridge,
  kind: 'swap',
  received: { symbol: 'ETH', iconUrl: null },
};

describe('toaster copy per terminal kind', () => {
  test.each<
    [TerminalKind | null, ToasterView, string, string | null, string | null]
  >([
    [null, swap, 'Swapping', 'USDC→ETH', null],
    ['success', swap, 'Swapped', 'USDC→ETH', null],
    ['success', bridge, 'Cross-chain swaps', 'may take a few minutes', null],
    ['failed', bridge, 'Bridge failed', 'USDC→USDC', null],
    [
      'submitted',
      bridge,
      'Transaction submitted',
      'Follow its progress in History.',
      'Go to History',
    ],
    [
      'complete',
      swap,
      'Complete your transaction',
      'One more transaction needs your signature. Continue in History.',
      'Go to History',
    ],
  ])('%s (%s)', (terminal, view, title, subtitle, actionLabel) => {
    expect(getTitle(view, terminal)).toBe(title);
    const line = getSubtitle(view, terminal);
    expect(
      line === null
        ? null
        : line.type === 'text'
        ? line.text
        : `${line.from}→${line.to}`
    ).toBe(subtitle);
    expect(getTerminalAction(terminal)?.label ?? null).toBe(actionLabel);
  });

  test.each<TerminalKind>(['submitted', 'complete'])(
    '%s: "Go to History" navigates to /overview/history',
    (terminal) => {
      expect(HISTORY_PATH).toBe('/overview/history');
      expect(getTerminalAction(terminal)).toEqual({
        label: 'Go to History',
        to: '/overview/history',
      });
    }
  );
});
