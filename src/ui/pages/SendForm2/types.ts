import type { NetworkFeeSpeed } from '@zeriontech/transactions';

export type SendFormState2 = {
  /** @description Blockchain the send happens on */
  inputChain: string;
  /** @description ID of the fungible token to send (mutually exclusive with nftId) */
  inputFungibleId: string;
  /** @description Unchanged UI input value in common units */
  inputAmount?: string;
  /** @description Whether inputAmount is interpreted as token quantity or fiat currency */
  inputKind?: 'token' | 'currency';

  /** @description Parsed recipient address */
  to?: string;

  /** @description Custom transaction data (native EVM sends only) */
  data?: string;

  /** @description ZPI NFT id `${chain}:${contractAddress}:${tokenId}` — presence flips the form into NFT mode */
  nftId?: string;
  /** @description Amount of NFT units to send (ERC-1155); undefined in token mode */
  nftAmount?: string;

  /** @description Gas limit */
  gasLimit?: string;
  /** @description Network speed type */
  networkFeeSpeed?: NetworkFeeSpeed;
  /** @description Maximum fee in GWEI */
  maxFee?: string;
  /** @description Maximum priority fee in GWEI */
  maxPriorityFee?: string;
  /** @description Gas price in GWEI */
  gasPrice?: string;
  /** @description Transaction nonce */
  nonce?: string;
};

export type HandleChangeFunction = <K extends keyof SendFormState2>(
  key: K,
  value: SendFormState2[K]
) => void;
