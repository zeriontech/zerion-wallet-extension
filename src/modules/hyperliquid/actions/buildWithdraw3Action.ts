import {
  HYPERLIQUID_CHAIN,
  HYPERLIQUID_SIGNATURE_CHAIN_ID_HEX,
} from '../constants';
import type { ExchangeWithdraw3Action } from './types';

// Mirrors iOS `ExchangeWithdrawAction`. The `time` field is both the EIP-712
// timestamp and the Hyperliquid /exchange nonce.
export function buildWithdraw3Action({
  amount,
  destination,
  time,
}: {
  amount: string;
  destination: string;
  time: number;
}): ExchangeWithdraw3Action {
  return {
    type: 'withdraw3',
    hyperliquidChain: HYPERLIQUID_CHAIN,
    signatureChainId: HYPERLIQUID_SIGNATURE_CHAIN_ID_HEX,
    amount,
    time,
    destination,
  };
}
