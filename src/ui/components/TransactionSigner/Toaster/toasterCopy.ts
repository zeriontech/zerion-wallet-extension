import { truncateAddress } from 'src/ui/shared/truncateAddress';
import type { ToasterView } from '../types';
import type { TerminalKind } from './useToasterSession';

export const HISTORY_PATH = '/overview/history';

const PROGRESS_TITLE: Record<ToasterView['kind'], string> = {
  approve: 'Approving',
  swap: 'Swapping',
  bridge: 'Bridging',
  send: 'Sending',
};

const SUCCESS_TITLE: Record<ToasterView['kind'], string> = {
  approve: 'Approved',
  swap: 'Swapped',
  bridge: 'Bridged',
  send: 'Sent',
};

const FAILED_TITLE: Record<ToasterView['kind'], string> = {
  approve: 'Approve failed',
  swap: 'Swap failed',
  bridge: 'Bridge failed',
  send: 'Send failed',
};

export function getTitle(
  view: ToasterView | undefined,
  terminal: TerminalKind | null
): string {
  if (terminal === null) {
    return view ? PROGRESS_TITLE[view.kind] : 'Executing';
  }
  switch (terminal) {
    case 'failed':
      return view ? FAILED_TITLE[view.kind] : 'Failed';
    case 'success':
      if (!view) return 'Done';
      if (view.kind === 'bridge') return 'Cross-chain swaps';
      return SUCCESS_TITLE[view.kind];
    case 'submitted':
      return 'Transaction submitted';
    case 'complete':
      return 'Complete your transaction';
    default: {
      const exhaustive: never = terminal;
      return exhaustive;
    }
  }
}

// A subtitle is either a plain text line, or a directional pair rendered with
// an animated arrow between the two sides.
export type Subtitle =
  | { type: 'text'; text: string }
  | { type: 'directional'; from: string; to: string };

function getStepSubtitle(view: ToasterView): Subtitle {
  if (view.kind === 'approve') {
    return { type: 'text', text: view.token.symbol };
  }
  if (view.kind === 'send') {
    const target =
      view.recipient.name ?? truncateAddress(view.recipient.address, 4);
    return { type: 'directional', from: view.token.symbol, to: target };
  }
  return {
    type: 'directional',
    from: view.sent.symbol,
    to: view.received.symbol,
  };
}

export function getSubtitle(
  view: ToasterView | undefined,
  terminal: TerminalKind | null
): Subtitle | null {
  switch (terminal) {
    case 'submitted':
      return { type: 'text', text: 'Follow its progress in History.' };
    case 'complete':
      return {
        type: 'text',
        text: 'One more transaction needs your signature. Continue in History.',
      };
    case 'success':
      if (view?.kind === 'bridge') {
        return { type: 'text', text: 'may take a few minutes' };
      }
      return view ? getStepSubtitle(view) : null;
    case 'failed':
    case null:
      return view ? getStepSubtitle(view) : null;
    default: {
      const exhaustive: never = terminal;
      return exhaustive;
    }
  }
}

export interface TerminalAction {
  label: string;
  to: string;
}

/** The text action a terminal offers besides copy / explorer */
export function getTerminalAction(
  terminal: TerminalKind | null
): TerminalAction | null {
  switch (terminal) {
    case 'submitted':
    case 'complete':
      return { label: 'Go to History', to: HISTORY_PATH };
    case 'success':
    case 'failed':
    case null:
      return null;
    default: {
      const exhaustive: never = terminal;
      return exhaustive;
    }
  }
}
