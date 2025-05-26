import type { NetworkFeeSpeed } from '@zeriontech/transactions';

export type SendFormState = {
  type: 'token' | 'nft';
  nftAmount: string;
  /** stores currently typed in address value even if it's not a valid addres */
  addressInputValue?: string;
  /**
   * stores resolved valid recipient address derived from addressInputValue
   * @see SendFormState.addressInputValue
   */
  to?: string;
  tokenValue?: string;
  tokenChain?: string;
  tokenAssetCode?: string;
  nftId?: string;
  gasLimit?: string;
  networkFeeSpeed?: NetworkFeeSpeed;
  maxFee?: string;
  maxPriorityFee?: string;
  gasPrice?: string;
  nonce?: string;
  slippage?: never;
};
