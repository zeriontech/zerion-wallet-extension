import type { IncomingTransaction } from 'src/modules/ethereum/types/IncomingTransaction';
import type { Fungible } from 'src/modules/zerion-api/types/Fungible';
import type { PartiallyRequired } from '../type-utils/PartiallyRequired';
import type { MultichainTransaction } from './MultichainTransaction';
import type { StringBase64 } from './StringBase64';

export interface ContractMetadata {
  id: string;
  name: string;
  icon_url: string;
  explorer: {
    name: string;
    tx_url: string;
  };
}

export interface TransactionDescription {
  data: string;
  from: string;
  to: string;
  gas: number;
  value: string;
  chain_id: string;
}

export interface QuoteLegacy {
  contract_metadata: ContractMetadata | null;
  slippage_type?: 'normal' | 'zero-slippage';

  input_chain: string;
  input_asset_id: string;
  input_token_address: string;
  input_token_id: string | null;
  input_amount_estimation: string;
  input_amount_max: string;

  output_chain: string;
  output_asset_id: string;
  output_token_address: string;
  output_token_id: string | null;
  output_amount_estimation: string;

  guaranteed_output_amount: string;
  output_amount_min: string;

  token_spender: string;

  gas_estimation: number | null;
  seconds_estimation: number | null;

  transaction: TransactionDescription | null;

  enough_allowance?: boolean;
  enough_balance: boolean;

  base_protocol_fee: number;

  protocol_fee: number;
  protocol_fee_amount: string;
  protocol_fee_asset_id: string | null;
  protocol_fee_asset_address: string | null;
  protocol_fee_taken_on_top: boolean | null;

  marketplace_fee: number;
  marketplace_fee_amount: number;

  bridge_fee_asset_id: string | null;
  bridge_fee_asset_address: string | null;
  bridge_fee_taken_on_top: boolean | null;
  bridge_fee_amount: string;
}

type Error = {
  /**
   * @description Error code with the following cases: // [!code link {"token":"Error","href":"/docs-v2/swap/entities.html#error"}]
   *     1 - Not enough input asset balance
   *     2 - Not enough base (gas) asset balance
   *
   * @enum {integer}
   */
  code: 1 | 2;
  /** @description Detailed error message, should be used only if client cannot handle the error */
  message: string;
  /**
   * @description Possible ways to resolve the error:
   *     1 - Top up the wallet
   *
   * @enum {integer|null}
   */
  hint: 1 | null;
};
type Amount = {
  currency: string;
  /** @description Amount in common units (like token units) */
  quantity: string;
  /** @description Amount in fiat units */
  value: number | null;
  /** @description Amount in USD */
  usdValue: number | null;
};

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
  const { type, nonce, ...rest } = tx;
  const partial = { type: parseInt(type), nonce: parseInt(nonce) };
  return {
    ...partial,
    ...rest,
  };
}

type TransactionSolana = string;

type TransactionMultichain = {
  evm: null | TransactionEVM;
  solana: null | TransactionSolana;
};

type ContractMetadata2 = {
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
  /** @description Minimum expected output amount for the swap */
  minimumOutputAmount: Amount;
  /** @description Error information if the swap cannot proceed.
   *     If both transactionApprove and transactionSwap props are null, this object must be defined.
   *      */
  error: null | Error;
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
  /** @description Gas back amount if applicable (when network fee is not free) */
  gasback: null | number;
  /** @description Estimated time if applicable (when it's a bridge transaction) */
  time?: null | number;
  /** @description Network fee information */
  networkFee: null | {
    /** @description Whether the network fee is free */
    free: boolean;
    /** @description Fee amount (can be expected fee or max fee) */
    amount: Amount;
    fungible: null | Fungible;
  };
  /** @description Approval transaction if required */
  transactionApprove: null | TransactionMultichain;
  /** @description Main swap transaction */
  transactionSwap: null | TransactionMultichain;
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
