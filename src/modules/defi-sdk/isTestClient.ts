import type { Client } from 'defi-sdk';
import { DEFI_SDK_TESTNET_API_URL } from 'src/env/config';

export function isTestClient(client: Client) {
  return client.url === DEFI_SDK_TESTNET_API_URL;
}
