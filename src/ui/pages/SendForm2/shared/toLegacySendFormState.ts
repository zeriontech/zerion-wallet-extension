import type { SendFormState } from 'src/ui/pages/SendForm/shared/SendFormState';
import type { SendFormState2 } from '../types';

export function toLegacySendFormState(
  s: SendFormState2,
  resolvedInputAmount: string | null
): SendFormState {
  return {
    type: s.nftId ? 'nft' : 'token',
    to: s.to,
    tokenChain: s.inputChain,
    tokenAssetCode: s.inputFungibleId,
    tokenValue: resolvedInputAmount ?? undefined,
    nftId: s.nftId,
    nftAmount: s.nftAmount ?? '',
    data: s.data,
    gasLimit: s.gasLimit,
    networkFeeSpeed: s.networkFeeSpeed,
    maxFee: s.maxFee,
    maxPriorityFee: s.maxPriorityFee,
    gasPrice: s.gasPrice,
    nonce: s.nonce,
  };
}
