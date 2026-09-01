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
  active: boolean;
}

export type Response = ResponseBody<AddressActivityStatus[]>;

export type AddressActivity = Record<string, AddressActivityStatus>;

function toAddressActivity(response: Response): AddressActivity {
  const result: AddressActivity = {};
  for (const { address, active } of response.data) {
    result[normalizeAddress(address)] = { address, active };
  }
  return result;
}

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
