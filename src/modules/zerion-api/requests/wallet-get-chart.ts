import type { ClientOptions } from '../shared';
import { CLIENT_DEFAULTS, ZerionHttpClient } from '../shared';
import type { ZerionApiContext } from '../zerion-api-bare';
import type { ResponseBody } from './ResponseBody';
import type { ChartPeriod } from './asset-get-chart';

export interface Params {
  addresses: string[];
  currency: string;
  period: ChartPeriod;
}

export interface WalletChart {
  points: Array<{
    timestamp: number;
    value: number;
  }>;
}

type Response = ResponseBody<WalletChart>;

export async function walletGetChart(
  this: ZerionApiContext,
  payload: Params,
  options: ClientOptions = CLIENT_DEFAULTS
) {
  const kyOptions = this.getKyOptions();
  return ZerionHttpClient.post<Response>(
    {
      endpoint: 'wallet/get-chart/v1',
      body: JSON.stringify(payload),
      ...options,
    },
    kyOptions
  );
}
