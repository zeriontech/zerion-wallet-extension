import type { ExternallyOwnedAccount } from 'src/shared/types/ExternallyOwnedAccount';
import type { TransactionContextParams } from 'src/shared/types/SignatureContextParams';
import type { MultichainTransaction } from 'src/shared/types/MultichainTransaction';
import type { SignTransactionResult } from 'src/shared/types/SignTransactionResult';
import type { StringBase64 } from 'src/shared/types/StringBase64';
import type { Quote2 } from 'src/shared/types/Quote';
import type { ExpectedIntentSigning } from 'src/ui/shared/forms/trading/intentTypedData';

export type SendTxParams = TransactionContextParams & {
  transaction: MultichainTransaction;
};

export type SignAllTransactionsParams = TransactionContextParams & {
  transaction: { solana: StringBase64[] };
};

/** An Intent Swap step: validate, sign the permit and the intent of `quote`, place the Order */
export type OrderStepParams = TransactionContextParams & {
  quote: Quote2;
  outputChain: string | null;
  /** Null for Solana intents, which carry no typed data */
  expected: ExpectedIntentSigning | null;
};

export type OrderStepResult = { order: { orderId: string } };

/** A broadcast transaction or a placed Order */
export type StepResult = SignTransactionResult | OrderStepResult;

type ToasterAsset = { symbol: string; iconUrl: string | null };
type ToasterChain = { iconUrl: string | null };

/** Fields every toaster view carries, whatever the step kind. */
type ToasterViewCommon = {
  /**
   * `{HASH}` template for the explorer link offered in the success state.
   * Null when the step has no explorer to link to; the toaster then falls
   * back to the explorer URL stored with the local transaction, if any.
   */
  explorerUrlTemplate?: string | null;
};

export type ToasterView = ToasterViewCommon &
  (
    | {
        kind: 'approve';
        token: ToasterAsset;
        chain: ToasterChain;
      }
    | {
        kind: 'swap' | 'bridge';
        sent: ToasterAsset;
        received: ToasterAsset;
        receivedChain: ToasterChain;
      }
    | {
        kind: 'send';
        token: ToasterAsset;
        chain: ToasterChain;
        recipient: { address: string; name?: string };
        isNft?: boolean;
      }
  );

export type SignStep =
  | { kind: 'send'; params: SendTxParams; toaster?: ToasterView }
  | {
      kind: 'signAll';
      params: SignAllTransactionsParams;
      toaster?: ToasterView;
    }
  | { kind: 'order'; params: OrderStepParams; toaster?: ToasterView };

export type QueueUiOptions = {
  holdToSign: boolean | null;
  bluetoothSupportEnabled: boolean | null;
  keyboardShortcutEnabled?: boolean | null;
};

export type QueueEvent =
  | { type: 'step-start'; index: number }
  | { type: 'step-signing'; index: number }
  | { type: 'step-pending'; index: number; txHash: string }
  | { type: 'step-order-placed'; index: number; orderId: string }
  | { type: 'step-success'; index: number; result: StepResult }
  | { type: 'step-error'; index: number; error: Error }
  | { type: 'queue-done'; results: StepResult[] }
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
  | { state: 'done'; results: StepResult[] }
  | { state: 'error'; failedAt: number; error: Error }
  | { state: 'aborted'; abortedAt: number };

export type QueueStatus = {
  queueId: string;
  totalSteps: number;
  run: QueueRunStatus;
};
