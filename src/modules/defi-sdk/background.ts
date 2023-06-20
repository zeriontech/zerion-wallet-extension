import { client } from 'defi-sdk';
import {
  DEFI_SDK_API_URL,
  DEFI_SDK_API_TOKEN,
  BACKEND_ENV,
} from 'src/env/config';
import { hooks } from './defi-sdk-config';

export function configureBackgroundClient() {
  if (!DEFI_SDK_API_URL || !DEFI_SDK_API_TOKEN) {
    throw new Error(
      'DEFI_SDK_API_URL and DEFI_SDK_API_TOKEN must be defined in ENV'
    );
  }
  client.configure({
    url: DEFI_SDK_API_URL,
    apiToken: DEFI_SDK_API_TOKEN,
    hooks,
    ioOptions: BACKEND_ENV
      ? { query: { backend_env: BACKEND_ENV } }
      : undefined,
  });
}
