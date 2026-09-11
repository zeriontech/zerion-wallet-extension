import type { TypedDataDomain, TypedDataField } from 'ethers';
import type { IncomingTransaction } from 'src/modules/ethereum/types/IncomingTransaction';
import type { Fungible } from 'src/modules/zerion-api/types/Fungible';
import type { Amount } from 'src/modules/zerion-api/types/Amount';
import type { TransactionPrepareError } from 'src/modules/zerion-api/types/TransactionPrepareError';
import type { PartiallyRequired } from '../type-utils/PartiallyRequired';
import type { MultichainTransaction } from './MultichainTransaction';
import type { StringBase64 } from './StringBase64';

export type TransactionEVM = {
  /**
   * Format: hex
   * @description Type of transaction
   * @example 0x1
   */
  type: string;
  from: string;
  to: string;
  /**
   * Format: hex
   * @description Transaction nonce // [!code link {"token":"Transaction","href":"/docs-v2/swap/entities.html#transaction"}]
   * @example 0x112
   */
  nonce: string;
  /**
   * Format: hex
   * @description ID of chain
   * @example 0x42
   */
  chainId: string;
  /**
   * Format: hex
   * @description Gas limit
   * @example 0x123456
   */
  gas: string;
  /**
   * Format: hex
   * @description Gas limit
   * @example 0x123456
   */
  gasPrice: string | null;
  /**
   * Format: hex
   * @description Maximum fee
   * @example 0x1000000
   */
  maxFee: string | null;
  /**
   * Format: hex
   * @description Maximum priority fee
   * @example 0x10
   */
  maxPriorityFee: string | null;
  /**
   * Format: hex
   * @description Transaction value // [!code link {"token":"Transaction","href":"/docs-v2/swap/entities.html#transaction"}]
   * @example 0x0
   */
  value: string;
  /**
   * Format: hex
   * @description Transaction data //
   * @example 0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890
   */
  data: string;
  /** @description Custom data for the transaction */
  customData: {
    paymasterParams: object | null;
    /**
     * Format: hex
     * @description Gas per pubdata byte limit
     * @example 0x123456
     */
    gasPerPubdataByte: string | null;
  } | null;
};
export function toIncomingTransaction(
  tx: TransactionEVM
): PartiallyRequired<IncomingTransaction, 'from' | 'chainId'> {
  const { type, nonce, gas, gasPrice, maxFee, maxPriorityFee, ...rest } = tx;
  const partial: IncomingTransaction = {
    type: parseInt(type),
    nonce: parseInt(nonce),
  };
  if (gas) {
    partial.gasLimit = gas;
  }
  if (maxFee != null || maxPriorityFee != null) {
    partial.maxPriorityFeePerGas = maxPriorityFee;
    partial.maxFeePerGas = maxFee;
  } else if (gasPrice != null) {
    partial.gasPrice = gasPrice;
  }
  return {
    ...partial,
    ...rest,
  };
}

type TransactionSolana = string;

export type TransactionMultichainBackend = {
  evm: null | TransactionEVM;
  solana: null | TransactionSolana;
};

type TransactionMultichain = TransactionMultichainBackend;

/**
 * EIP-712 document as served by swap API v3 for Intent Swaps and Permit
 * Approvals. `types` never contains `EIP712Domain` (ethers derives it) and
 * `message` may arrive serialized as a JSON string.
 */
export type TypedDataDocument = {
  types: Record<string, Array<TypedDataField>>;
  primaryType: string;
  domain: TypedDataDomain;
  message: Record<string, unknown> | string;
};

/**
 * Off-chain payload the user signs for an Intent Swap. Exactly one side is
 * set: `evm` is an EIP-712 document, `solana` is a base64 serialized
 * transaction to sign without broadcasting.
 */
export type IntentSwapPayload = {
  evm: null | TypedDataDocument;
  solana: null | StringBase64;
};

/** Permit Approval to sign alongside the Swap Intent. EVM only. */
export type IntentApprovePayload = {
  evm: null | TypedDataDocument;
  solana: null;
};

export type ContractMetadata2 = {
  /**
   * @description ID of liquidity source, may be used as `source_id` parameter
   * @example defi-sdk
   */
  id: string;
  /**
   * @description Human-readable name of liquidity source
   * @example Zerion
   */
  name: string;
  /**
   * @description URL with icon of liquidity source, might be empty
   * @example https://protocol-icons.s3.amazonaws.com/zerion%20defi%20sdk.png
   */
  iconUrl: string;
  /** @description Explorer details */
  explorer: {
    /**
     * @description Name of explorer to be shown to the user
     * @example DecentScan
     */
    name: string;
    /**
     * @description Template for link to tx, replace {HASH} with an actual tx hash
     * @example https://decentscan/xyz/tx={HASH}
     */
    txUrl: string;
  } | null;
};

// TODO: rename to Quote when QuoteLegacy is removed
export interface Quote2 {
  contractMetadata: ContractMetadata2;
  /** @description Expected output amount for the swap */
  outputAmount: Amount;
  /** @description Expected output amount for the swap after all fees are deducted */
  outputAmountAfterFees: Amount;
  /** @description Minimum expected output amount for the swap */
  minimumOutputAmount: Amount;
  /** @description Error information if the swap cannot proceed.
   *     If both transactionApprove and transactionSwap props are null, this object must be defined.
   *      */
  error: null | TransactionPrepareError;
  /** @description Protocol fee information */
  protocolFee: {
    /** @description Base percentage for the fee (5 means 5%) */
    basePercentage: number;
    /** @description Actual percentage applied for the fee */
    percentage: number;
    fungible: null | Fungible;
    amount: Amount;
  };
  /** @description Bridge fee information if applicable */
  bridgeFee: null | {
    fungible: null | Fungible;
    amount: Amount;
  };
  /** @description Exchange rate information as a tuple */
  rate: {
    value: number;
    symbol: string;
  }[];
  /** @description Estimated time if applicable (when it's a bridge transaction) */
  time?: null | number;
  /** @description Network fee information */
  networkFee: null | {
    /** @description Whether the network fee is free */
    free: boolean;
    /** @description Fee amount (can be expected fee or max fee) */
    amount: Amount | null;
    fungible: null | Fungible;
  };
  /**
   * @description Opaque id for `transaction/execute-order/v1`. Changes on
   * every stream update; may be `""` on a quote carrying `error`.
   */
  quoteId: string;
  /** @description Approval transaction if required (On-chain Approval) */
  transactionApprove: null | TransactionMultichain;
  /** @description Main swap transaction (On-chain Swap) */
  transactionSwap: null | TransactionMultichain;
  /** @description Swap Intent to sign (Intent Swap). Mutually exclusive with transactionSwap */
  intentSwap: null | IntentSwapPayload;
  /** @description Permit Approval to sign. Mutually exclusive with transactionApprove */
  intentApprove: null | IntentApprovePayload;
  /** @description Slippage chosen by the backend when the request omits one (auto mode). */
  autoSlippage: number | null;
  /** @description Final slippage applied to the quote, in percent (e.g. 0.5 = 0.5%). */
  finalSlippage: number | null;
}

export function toMultichainTransaction(
  tx: TransactionMultichain
): MultichainTransaction {
  if (tx.solana) {
    return { solana: tx.solana as StringBase64 };
  } else if (tx.evm) {
    return { evm: toIncomingTransaction(tx.evm) };
  }
  throw new Error('Unexpected TransactionMultichain object');
}

/** A quote executed by signing a Swap Intent and placing an Order. */
export function isIntentQuote(quote: Quote2): boolean {
  return quote.intentSwap != null && quote.quoteId !== '';
}

/**
 * Executable Quote: carries either an On-chain Swap transaction or a Swap
 * Intent with a usable quoteId, and no error. Both kinds are first-class.
 */
export function isExecutableQuote(quote: Quote2): boolean {
  return (
    quote.error == null &&
    (quote.transactionSwap != null || isIntentQuote(quote))
  );
}

/** Parses a `message` that arrived as a JSON string. */
export function normalizeTypedDataDocument(
  document: TypedDataDocument
): TypedDataDocument & { message: Record<string, unknown> } {
  const message =
    typeof document.message === 'string'
      ? (JSON.parse(document.message) as Record<string, unknown>)
      : document.message;
  return { ...document, message };
}
