import { createUrl } from 'src/shared/createUrl';

const backendUrl = (url: string | undefined, backend_env: string | undefined) => {
  if (url) {
    return createUrl({
      base: url,
      pathname: '',
      searchParams: backend_env ? { backend_env } : undefined,
    }).toString();
  }
};

export const BACKEND_ENV = process.env.BACKEND_ENV;
export const DEFI_SDK_API_TOKEN = process.env.DEFI_SDK_API_TOKEN;
export const DEFI_SDK_API_URL = backendUrl(process.env.DEFI_SDK_API_URL, BACKEND_ENV);
export const DEFI_SDK_TESTNET_API_URL = backendUrl(process.env.DEFI_SDK_TESTNET_API_URL, BACKEND_ENV);
export const ZERION_API_URL = backendUrl(process.env.ZERION_API_URL, BACKEND_ENV);
export const ZERION_TESTNET_API_URL = backendUrl(process.env.ZERION_TESTNET_API_URL, BACKEND_ENV);
export const DEFI_SDK_TRANSACTIONS_API_URL = backendUrl(process.env.DEFI_SDK_TRANSACTIONS_API_URL, BACKEND_ENV);

export const PROXY_URL = process.env.PROXY_URL;
export const SOCIAL_API_URL = process.env.SOCIAL_API_URL;
export const MIXPANEL_TOKEN_PUBLIC = process.env.MIXPANEL_TOKEN_PUBLIC;

export const FEATURE_LOYALTY_FLOW = process.env.FEATURE_LOYALTY_FLOW === 'on' ? 'on' : null; // avoid accidental false-positives for truthy "off"
export const SLOW_MODE = false;

if (!PROXY_URL) {
  throw new Error('PROXY_URL must be defined in ENV');
}
if (!ZERION_API_URL) {
  throw new Error('ZERION_API_URL must be defined in ENV');
}
