export const DEFI_SDK_API_URL = process.env.DEFI_SDK_API_URL;
export const DEFI_SDK_TESTNET_API_URL = process.env.DEFI_SDK_TESTNET_API_URL;
export const ZERION_API_URL = process.env.ZERION_API_URL;
export const ZERION_TESTNET_API_URL = process.env.ZERION_TESTNET_API_URL;
export const PROXY_URL = process.env.PROXY_URL;
export const DEFI_SDK_API_TOKEN = process.env.DEFI_SDK_API_TOKEN;
export const DEFI_SDK_TRANSACTIONS_API_URL =
  process.env.DEFI_SDK_TRANSACTIONS_API_URL;
export const SOCIAL_API_URL = process.env.SOCIAL_API_URL;
export const BACKEND_ENV = process.env.BACKEND_ENV;
export const MIXPANEL_TOKEN_PUBLIC = process.env.MIXPANEL_TOKEN_PUBLIC;
export const SLOW_MODE = false;
export const FEATURE_PAYMASTER_ENABLED = process.env.FEATURE_PAYMASTER === 'on';

if (!PROXY_URL) {
  throw new Error('PROXY_URL must be defined in ENV');
}
if (!ZERION_API_URL) {
  throw new Error('ZERION_API_URL must be defined in ENV');
}
