import {
  HYPERLIQUID_CHAIN,
  HYPERLIQUID_SIGNATURE_CHAIN_ID_HEX,
} from '../constants';
import type { ExchangeApproveBuilderFeeAction } from './types';

export function buildApproveBuilderFeeAction({
  maxFeeRate,
  builder,
  nonce,
}: {
  maxFeeRate: string;
  builder: string;
  nonce: number;
}): ExchangeApproveBuilderFeeAction {
  return {
    type: 'approveBuilderFee',
    maxFeeRate,
    builder,
    hyperliquidChain: HYPERLIQUID_CHAIN,
    signatureChainId: HYPERLIQUID_SIGNATURE_CHAIN_ID_HEX,
    nonce,
  };
}
