import type { NetworkFeeSpeed } from '@zeriontech/transactions';

export type SwapFormState = {
  /** @description Currency name for price conversions */
  currency?: string;
  /** @description Source blockchain for the swap */
  inputChain?: string;
  /** @description Destination blockchain for bridge transactions */
  outputChain?: string;
  // /** @description Ethereum or Solana address of the sender */
  // from?: string;
  /** @description Recipient address for bridge transactions */
  to?: string;
  /** @description ID of the fungible token to swap from */
  inputFungibleId?: string;
  /** @description ID of the fungible token to swap to */
  outputFungibleId?: string;
  /** @description Unchanged UI input value in common units */
  inputAmount?: string;
  /** todo */
  networkFeeSpeed?: NetworkFeeSpeed;
  /** @description Maximum priority fee in GWEI */
  maxPriorityFee?: string;
  /** @description Maximum fee in GWEI */
  maxFee?: string;
  /** @description Gas price in GWEI */
  gasPrice?: string;
  /** @description Gas limit */
  gasLimit?: string;
  /** @description Prioritization fee for Solana transactions */
  prioritizationFee?: string;
  /** @description Transaction nonce */
  nonce?: string;
  /** @description Maximum acceptable slippage in percents */
  slippage?: string;
  /** @description Sorting criteria for bridge options, amount = 1, time = 2, default = 1 */
  sort?: '1' | '2';
};
