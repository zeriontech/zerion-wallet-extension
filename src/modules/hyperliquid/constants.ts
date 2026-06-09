export const HYPERLIQUID_EXCHANGE_URL = 'https://api.hyperliquid.xyz/exchange';
export const HYPERLIQUID_INFO_URL = 'https://api.hyperliquid.xyz/info';

export const MIN_ORDER_NOTIONAL_USD = 10;
export const DEFAULT_SLIPPAGE = 0.01;

export const HYPERLIQUID_L1_DOMAIN = {
  name: 'Exchange',
  version: '1',
  chainId: 1337,
  verifyingContract: '0x0000000000000000000000000000000000000000',
} as const;

export const HYPERLIQUID_USER_SIGNED_DOMAIN = {
  name: 'HyperliquidSignTransaction',
  version: '1',
  verifyingContract: '0x0000000000000000000000000000000000000000',
} as const;

export const HYPERLIQUID_SIGNATURE_CHAIN_ID_HEX = '0xa4b1';
export const HYPERLIQUID_SIGNATURE_CHAIN_ID = 42161;
export const HYPERLIQUID_CHAIN = 'Mainnet';

export const BUILDER_DEX_ASSET_ID_BASE = 100_000;
export const BUILDER_DEX_ASSET_ID_DEX_STRIDE = 10_000;
