import { nanoid } from 'nanoid';
import type { BlockchainType } from 'src/shared/wallet/classifiers';

export interface LedgerSignParams {
  ecosystem?: BlockchainType;
  supportBluetooth?: boolean;
}

export interface LedgerIframeController {
  /** Returns the iframe's contentWindow if mounted, otherwise null. */
  getContentWindow: () => Window | null;
  /** Pushes partial sign-params into the iframe (merged on the iframe side). */
  setSignParams: (partial: LedgerSignParams) => void;
  /** Best-effort cancel of any in-flight ledger request inside the iframe. */
  cancelInFlight: () => void;
}

interface InternalHandle {
  controller: LedgerIframeController | null;
}

const handle: InternalHandle = { controller: null };

export function setLedgerIframeController(
  controller: LedgerIframeController | null
): void {
  handle.controller = controller;
}

export function getLedgerIframeController(): LedgerIframeController | null {
  return handle.controller;
}

/** Convenience for runner: posts setSignParams to iframe via current handle. */
export function postLedgerSignParams(partial: LedgerSignParams) {
  handle.controller?.setSignParams(partial);
}

/** Convenience: post any RPC-ish message to iframe with a fresh id. */
export function postLedgerMessage(method: string, params?: unknown) {
  const win = handle.controller?.getContentWindow();
  if (!win) return;
  win.postMessage({ id: nanoid(), method, params: params ?? {} }, '*');
}
