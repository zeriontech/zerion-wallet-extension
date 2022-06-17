import { client } from 'defi-sdk';
import { DEFI_SDK_API_URL, DEFI_SDK_API_TOKEN } from 'src/env/config';
import { BackgroundMemoryCache } from './BackgroundMemoryCache';

const backgroundCache = new BackgroundMemoryCache();

export async function configureUIClient() {
  // This client instance uses background script's memory as cache
  backgroundCache.load().then(() => {
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
    });
  });
}

export function configureBackgroundClient() {
  if (!DEFI_SDK_API_URL || !DEFI_SDK_API_TOKEN) {
    throw new Error(
      'DEFI_SDK_API_URL and DEFI_SDK_API_TOKEN must be defined in ENV'
    );
  }
  client.configure({
    url: DEFI_SDK_API_URL,
    apiToken: DEFI_SDK_API_TOKEN,
  });
}
