import type { ClientOptions } from '../shared';
import { CLIENT_DEFAULTS, ZerionHttpClient } from '../shared';
import type { ZerionApiContext } from '../zerion-api-bare';
import type { ResponseBody } from './ResponseBody';

export interface Params {
  assetId: string;
  /** Wallet the user hid the asset from; ZPI uses it for the spam report. */
  wallet?: string;
}

type Response = ResponseBody<null>;

/**
 * Reports a fungible as spam. Fire-and-forget from the hide flow; callers
 * ignore failures so reporting never blocks hiding.
 */
export async function assetReportSpam(
  this: ZerionApiContext,
  { assetId, wallet }: Params,
  options: ClientOptions = CLIENT_DEFAULTS
) {
  const body = wallet ? { assetId, wallet } : { assetId };
  return ZerionHttpClient.post<Response>(
    {
      endpoint: 'asset/report-spam/v1',
      body: JSON.stringify(body),
      ...options,
    },
    this.getKyOptions()
  );
}
