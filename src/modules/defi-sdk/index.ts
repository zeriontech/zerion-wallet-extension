import { client } from 'defi-sdk';
import {
  DEFI_SDK_API_URL,
  DEFI_SDK_API_TOKEN,
  BACKEND_ENV,
} from 'src/env/config';
import { BackgroundMemoryCache } from './BackgroundMemoryCache';

export const backgroundCache = new BackgroundMemoryCache();

export async function configureUIClient() {
  // This client instance uses background script's memory as cache
  return backgroundCache.load().then(() => {
    if (!DEFI_SDK_API_URL || !DEFI_SDK_API_TOKEN) {
      throw new Error(
        'DEFI_SDK_API_URL and DEFI_SDK_API_TOKEN must be defined in ENV'
      );
    }
    client.configure({
      getCacheKey: ({ key }) => key,
      cache: backgroundCache,
      url: DEFI_SDK_API_URL,
      apiToken: DEFI_SDK_API_TOKEN,
      ioOptions: BACKEND_ENV
        ? { query: { backend_env: BACKEND_ENV } }
        : undefined,
    });
  });
}
