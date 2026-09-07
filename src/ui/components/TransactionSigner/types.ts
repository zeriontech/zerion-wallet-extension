import type { ExternallyOwnedAccount } from 'src/shared/types/ExternallyOwnedAccount';
import type { TransactionContextParams } from 'src/shared/types/SignatureContextParams';
import type { MultichainTransaction } from 'src/shared/types/MultichainTransaction';
import type { SignTransactionResult } from 'src/shared/types/SignTransactionResult';
import type { StringBase64 } from 'src/shared/types/StringBase64';
import type { Quote2 } from 'src/shared/types/Quote';
import type { SwapFormState } from 'src/shared/types/SwapFormState';

export type SendTxParams = TransactionContextParams & {
  transaction: MultichainTransaction;
};

export type SignAllTransactionsParams = TransactionContextParams & {
  transaction: { solana: StringBase64[] };
};

/** Parameters needed to re-open the quote stream after an On-chain Approval */
export type RequoteParams = {
  address: string;
  currency: string;
  /** Exact form state the original stream was requested with */
  formState: SwapFormState;
  /** `quote.contractMetadata.id` of the quote the user accepted */
  providerId: string;
};

export type OrderTarget = {
  from: string;
  inputChain: string;
  outputChain: string;
  explorerUrlTemplate: string | null;
};

/**
 * Intent Swap step: (re-quote →) sign Permit Approval + Swap Intent → place an
 * Order → wait for settlement. `quote` is the Executable intent quote at
 * enqueue time; `requote` is set iff step 0 was an On-chain Approval.
 */
export type OrderStepParams = Omit<
  TransactionContextParams,
  'quote' | 'outputChain'
> & {
  quote: Quote2;
  outputChain: string | null;
  requote: RequoteParams | null;
  order: OrderTarget;
};

export type OrderStepResult = {
  order: { orderId: string; status: 'confirmed' | 'timeout' };
};

/** Result of one queue step: a broadcast transaction or a placed Order */
export type StepResult = SignTransactionResult | OrderStepResult;

type ToasterAsset = { symbol: string; iconUrl: string | null };
type ToasterChain = { iconUrl: string | null };

export type ToasterView =
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
    };

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
  /** Order step: re-opening the quote stream after a mined approval */
  | { type: 'step-requoting'; index: number }
  /** Order step: `execute-order` accepted, waiting for settlement */
  | { type: 'step-order-pending'; index: number; orderId: string }
  /** Order step: still pending after the bounded wait; background keeps polling */
  | { type: 'step-still-processing'; index: number; orderId: string }
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
