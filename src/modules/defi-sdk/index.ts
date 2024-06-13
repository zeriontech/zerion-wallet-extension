import memoizeOne from 'memoize-one';
import { client, Client } from 'defi-sdk';
import {
  DEFI_SDK_API_URL,
  DEFI_SDK_API_TOKEN,
  BACKEND_ENV,
  DEFI_SDK_TESTNET_API_URL,
} from 'src/env/config';
import { invariant } from 'src/shared/invariant';
import { version } from 'src/shared/packageVersion';
import { platform } from 'src/shared/analytics/platform';
import { BackgroundMemoryCache } from './BackgroundMemoryCache';
import { hooks } from './defi-sdk-config';

export const backgroundCache = new BackgroundMemoryCache();

export async function configureUIClient() {
  // This client instance uses background script's memory as cache
  return backgroundCache.load().then(() => {
    invariant(DEFI_SDK_API_URL, 'DEFI_SDK_API_URL not defined');
    invariant(DEFI_SDK_API_TOKEN, 'DEFI_SDK_API_TOKEN not defined');
    client.configure({
      getCacheKey: ({ key }) => key,
      cache: backgroundCache,
      url: DEFI_SDK_API_URL,
      apiToken: DEFI_SDK_API_TOKEN,
      hooks,
      ioOptions: {
        query: Object.assign(
          { platform, platform_version: version },
          BACKEND_ENV ? { backend_env: BACKEND_ENV } : undefined
        ),
      },
    });
  });
}

export const configureUITestClient = memoizeOne(() => {
  invariant(DEFI_SDK_TESTNET_API_URL, 'DEFI_SDK_TESTNET_API_URL not defined');
  invariant(DEFI_SDK_API_TOKEN, 'DEFI_SDK_API_TOKEN not defined');
  const client = new Client({
    url: DEFI_SDK_TESTNET_API_URL,
    apiToken: DEFI_SDK_API_TOKEN,
    hooks,
    ioOptions: {
      query: Object.assign(
        { platform, platform_version: version },
        BACKEND_ENV ? { backend_env: BACKEND_ENV } : undefined
      ),
    },
  });
  return client;
});
