export const DEFI_SDK_API_URL = process.env.DEFI_SDK_API_URL;
export const ZERION_API_URL = process.env.ZERION_API_URL;
export const PROXY_URL = process.env.PROXY_URL;
export const DEFI_SDK_API_TOKEN = process.env.DEFI_SDK_API_TOKEN;
export const DEFI_SDK_TRANSACTIONS_API_URL =
  process.env.DEFI_SDK_TRANSACTIONS_API_URL;
export const SOCIAL_API_URL = process.env.SOCIAL_API_URL;
export const BACKEND_ENV = process.env.BACKEND_ENV;
export const FEATURE_WAITLIST_ONBOARDING =
  process.env.FEATURE_WAITLIST_ONBOARDING;
export const SLOW_MODE = false;

if (!PROXY_URL) {
  throw new Error('PROXY_URL must be defined in ENV');
}
if (!ZERION_API_URL) {
  throw new Error('ZERION_API_URL must be defined in ENV');
}
