import { normalizeAddress } from 'src/shared/normalizeAddress';
import type { ClientOptions } from '../shared';
import { ZerionHttpClient } from '../shared';
import type { ZerionApiContext } from '../zerion-api-bare';
import type { ResponseBody } from './ResponseBody';

export interface Params {
  addresses: string[];
}

interface AddressActivityStatus {
  address: string;
  activityStatus: boolean;
}

export type Response = ResponseBody<AddressActivityStatus[]>;

/**
 * Shape the old `address`/`activity` socket scope returned. Kept verbatim so
 * that every consumer (including `helpers.ts`'s `activeWallets[normalizeAddress(
 * address)]?.active` lookup) is untouched by the migration.
 */
export type AddressActivity = Record<
  string,
  { address: string; active: boolean }
>;

/**
 * ZPI answers with an array; the socket answered with a record. Keying by
 * `normalizeAddress` rather than by whatever casing the backend echoes is
 * load-bearing: consumers look up by the normalized address, and a mismatch
 * would silently report every wallet as inactive.
 */
function toAddressActivity(response: Response): AddressActivity {
  const result: AddressActivity = {};
  for (const { address, activityStatus } of response.data) {
    result[normalizeAddress(address)] = { address, active: activityStatus };
  }
  return result;
}

/**
 * No `Zerion-Wallet-Provider` header on purpose: this is called with addresses
 * that are not imported yet, so the provider would always resolve to
 * `viewer_not_added`.
 */
export async function walletCheckActivity(
  this: ZerionApiContext,
  params: Params,
  options?: ClientOptions
) {
  const endpoint = 'wallet/check-activity/v1';
  const kyOptions = this.getKyOptions();
  const response = await ZerionHttpClient.post<Response>(
    { endpoint, body: JSON.stringify(params), ...options },
    kyOptions
  );
  return toAddressActivity(response);
}
