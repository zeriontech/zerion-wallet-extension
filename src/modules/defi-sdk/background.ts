import { Client, client } from 'defi-sdk';
import memoizeOne from 'memoize-one';
import {
  DEFI_SDK_API_URL,
  DEFI_SDK_API_TOKEN,
  BACKEND_ENV,
  DEFI_SDK_TESTNET_API_URL,
} from 'src/env/config';
import { version } from 'src/shared/packageVersion';
import { platform } from 'src/shared/analytics/platform';
import { invariant } from 'src/shared/invariant';
import { hooks } from './defi-sdk-config';

export function configureBackgroundClient() {
  invariant(DEFI_SDK_API_URL, 'DEFI_SDK_API_URL not defined');
  invariant(DEFI_SDK_API_TOKEN, 'DEFI_SDK_API_TOKEN not defined');
  client.configure({
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
}

export const configureBackgroundTestClient = memoizeOne(() => {
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

export function getDefiSdkClient(testMode: { on: boolean }) {
  return testMode.on ? configureBackgroundTestClient() : client;
}
