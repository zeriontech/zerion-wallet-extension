// import type { NetworkFeeSpeed } from '@zeriontech/transactions';

export type SwapFormState2 = {
  /** @description Source blockchain for the swap */
  inputChain: string;
  /** @description ID of the fungible token to swap from */
  inputFungibleId: string;
  /** @description Destination blockchain for bridge transactions */
  inputAmount?: string;
  /** @description ID of the fungible token to swap to */

  outputChain?: string;
  /** @description Unchanged UI input value in common units */
  outputFungibleId?: string;

  /** @description Parsed receiver address */
  to?: string;
  /** @description Raw input value from receiver input */
  receiverAddressInput?: string;
  /** @description Whether to show receiver address input */
  showReceiverAddressInput?: 'on' | 'off';

  /** @description Maximum acceptable slippage in percents */
  slippage?: 'auto' | string;
  /** @description Transaction nonce */
  nonce?: string;

  // /** @description Network speed type */
  // networkFeeSpeed?: NetworkFeeSpeed;
  // /** @description Maximum priority fee in GWEI */
  // maxPriorityFee?: string;
  // /** @description Maximum fee in GWEI */
  // maxFee?: string;
  // /** @description Gas price in GWEI */
  // gasPrice?: string;
  // /** @description Gas limit */
  // gasLimit?: string;
  // /** @description Prioritization fee for Solana transactions */
  // prioritizationFee?: string;
  // /** @description Sorting criteria for bridge options, amount = 1, time = 2, default = 1 */
  // sort?: '1' | '2';
};

export type HandleChangeFunction = <K extends keyof SwapFormState2>(
  key: K,
  value: SwapFormState2[K]
) => void;
