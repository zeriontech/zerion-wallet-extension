import type { ExternallyOwnedAccount } from 'src/shared/types/ExternallyOwnedAccount';
import type { TransactionContextParams } from 'src/shared/types/SignatureContextParams';
import type { MultichainTransaction } from 'src/shared/types/MultichainTransaction';
import type { SignTransactionResult } from 'src/shared/types/SignTransactionResult';
import type { StringBase64 } from 'src/shared/types/StringBase64';

export type SendTxParams = TransactionContextParams & {
  transaction: MultichainTransaction;
};

export type SignAllTransactionsParams = TransactionContextParams & {
  transaction: { solana: StringBase64[] };
};

export type SignStep =
  | { kind: 'send'; params: SendTxParams }
  | { kind: 'signAll'; params: SignAllTransactionsParams };

export type QueueUiOptions = {
  holdToSign: boolean | null;
  bluetoothSupportEnabled: boolean | null;
  keyboardShortcutEnabled?: boolean | null;
};

export type QueueEvent =
  | { type: 'step-start'; index: number }
  | { type: 'step-success'; index: number; result: SignTransactionResult }
  | { type: 'step-error'; index: number; error: Error }
  | { type: 'queue-done'; results: SignTransactionResult[] }
  | {
      type: 'queue-aborted';
      reason: 'user-dismissed' | 'error';
      index: number;
    };

export type SignTransactionsOptions = QueueUiOptions & {
  wallet: ExternallyOwnedAccount;
  signal?: AbortSignal;
  onEvent?: (event: QueueEvent) => void;
};

export type QueueRunStatus =
  | { state: 'pending' }
  | { state: 'running'; currentStep: number }
  | { state: 'done'; results: SignTransactionResult[] }
  | { state: 'error'; failedAt: number; error: Error }
  | { state: 'aborted'; abortedAt: number };

export type QueueStatus = {
  queueId: string;
  totalSteps: number;
  run: QueueRunStatus;
};
