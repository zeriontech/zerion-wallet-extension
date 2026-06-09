import {
  HYPERLIQUID_CHAIN,
  HYPERLIQUID_SIGNATURE_CHAIN_ID_HEX,
} from '../constants';
import type { ExchangeSetAbstractionAction, SetAbstractionMode } from './types';

export function buildSetAbstractionAction({
  user,
  nonce,
  abstraction = 'unifiedAccount',
}: {
  user: string;
  nonce: number;
  abstraction?: SetAbstractionMode;
}): ExchangeSetAbstractionAction {
  return {
    type: 'userSetAbstraction',
    user,
    abstraction,
    hyperliquidChain: HYPERLIQUID_CHAIN,
    signatureChainId: HYPERLIQUID_SIGNATURE_CHAIN_ID_HEX,
    nonce,
  };
}
