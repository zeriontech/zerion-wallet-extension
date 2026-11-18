import { isObj } from 'src/shared/isObj';

export type TransactionErrorStage = 'sign' | 'broadcast';

/** What the "Signed Transaction" event reports about a transaction that was not sent */
export interface TransactionFailure {
  /** The message shown to the user or the dapp, unredacted (what `transactionFailed` carried before) */
  message: string;
  /** `error_code`: stable across platforms, see transactionFailure.ts */
  code: string;
  stage: TransactionErrorStage;
  /** `error_message`: the node's own message, when it gave one */
  nodeMessage: string | null;
  /** The wallet that tried to send; null when it is not known */
  address: string | null;
}

export type TransactionFailureDetails = Pick<TransactionFailure, 'code' | 'nodeMessage'>;

/**
 * Replaces addresses, transaction hashes and Solana signatures in a message.
 * Same three replacements, in the same order, as the iOS app's
 * `redactingAddresses` (`Error+Analytics.swift`).
 */
export function redactAddresses(text: string): string {
  return text
    .replace(/0x[0-9a-fA-F]{40,}/g, '0x…')
    .replace(/\b[0-9a-fA-F]{40,}\b/g, '…')
    .replace(/\b[1-9A-HJ-NP-Za-km-z]{32,}\b/g, '…');
}

type NodeError = { code: number; message: string };

function isNodeError(value: unknown): value is NodeError {
  return isObj(value) && typeof value.code === 'number' && typeof value.message === 'string';
}

/**
 * Finds the node's JSON-RPC error (`{ code: number, message: string }`) inside a
 * thrown provider error. Ethers v6 keeps it in `error.info.error` for the cases
 * it recognizes, or in `error.error` for the "could not coalesce error" it
 * throws otherwise; older ethers and dapp-provided errors nest it one level
 * deeper (`error.error.error`), and `getEthersError` also understands an
 * `error.body` JSON string.
 */
export function findNodeError(value: unknown, depth = 0): NodeError | null {
  if (isNodeError(value)) {
    return value;
  }
  if (depth >= 3) {
    return null;
  }
  if (typeof value === 'string') {
    try {
      return findNodeError(JSON.parse(value), depth + 1);
    } catch {
      return null;
    }
  }
  if (!isObj(value)) {
    return null;
  }
  for (const nested of [value.error, value.info, value.body]) {
    if (nested == null) {
      continue;
    }
    const found = findNodeError(nested, depth + 1);
    if (found) {
      return found;
    }
  }
  return null;
}

type EvmBroadcastKind =
  | 'already_known'
  | 'nonce_too_low'
  | 'insufficient_funds'
  | 'underpriced'
  | 'server_error'
  | 'rejected';

/** The rules of `EthereumSendError.kind`, in the same order */
function getEvmBroadcastKind(text: string, code: number): EvmBroadcastKind {
  if (
    text.includes('already known') ||
    text.includes('alreadyknown') ||
    text.startsWith('known transaction')
  ) {
    return 'already_known';
  }
  if (text.includes('nonce too low') || text.includes('oldnonce')) {
    return 'nonce_too_low';
  }
  if (text.includes('insufficient') && text.includes('funds')) {
    return 'insufficient_funds';
  }
  if (text.includes('underpriced')) {
    return 'underpriced';
  }
  const isServerError =
    code === -32603 ||
    ['internal', 'forwarding', 'timeout'].some((word) => text.includes(word)) ||
    text.startsWith('post "');
  return isServerError ? 'server_error' : 'rejected';
}

/**
 * Mirrors `EthereumSendError`: an error without a recognizable node error never
 * reached a node, so it is a transport failure with no node message.
 */
export function classifyEvmBroadcastError(error: unknown): TransactionFailureDetails {
  const nodeError = findNodeError(error);
  if (!nodeError) {
    return { code: 'broadcast.transport', nodeMessage: null };
  }
  const kind = getEvmBroadcastKind(nodeError.message.toLowerCase(), nodeError.code);
  return { code: `broadcast.${kind}`, nodeMessage: nodeError.message };
}

/**
 * Mirrors `SolanaWeb3Error`: iOS reports `solana.<rpc code>` when it knows the
 * node's numeric code and `web3.send_failed` when it does not. `@solana/web3.js`
 * 1.98 throws `SendTransactionError`, which keeps the node's message in
 * `transactionMessage` but discards the code, so the extension always takes the
 * second branch; any other error is a generic broadcast failure.
 */
export function classifySolanaBroadcastError(error: unknown): TransactionFailureDetails {
  if (isObj(error) && typeof error.transactionMessage === 'string') {
    return { code: 'web3.send_failed', nodeMessage: error.transactionMessage };
  }
  return { code: 'broadcast.failed', nodeMessage: null };
}

/** Mirrors `WalletAdapterError.signFailureCode` for signing that stays in the wallet */
export function classifySignError(error: unknown): TransactionFailureDetails {
  const message = error instanceof Error ? error.message : typeof error === 'string' ? error : '';
  return {
    code: message.toLowerCase().includes('reject') ? 'sign.user_rejected' : 'sign.failed',
    nodeMessage: null,
  };
}
