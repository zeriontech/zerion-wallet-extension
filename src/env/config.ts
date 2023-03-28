export const ALCHEMY_KEY = process.env.ALCHEMY_KEY;
export const DEFI_SDK_API_URL = process.env.DEFI_SDK_API_URL;
export const PROXY_URL = process.env.PROXY_URL;
export const DEFI_SDK_API_TOKEN = process.env.DEFI_SDK_API_TOKEN;
export const SOCIAL_API_URL = process.env.SOCIAL_API_URL;
export const BACKEND_ENV = process.env.BACKEND_ENV;
export const FEATURE_WAITLIST_ONBOARDING =
  process.env.FEATURE_WAITLIST_ONBOARDING === 'on';

if (!PROXY_URL) {
  throw new Error('PROXY_URL must be defined in ENV');
}
