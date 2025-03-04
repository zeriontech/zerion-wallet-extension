import type { ClientOptions } from '../shared';
import { CLIENT_DEFAULTS, ZerionHttpClient } from '../shared';
import type { ZerionApiContext } from '../zerion-api-bare';
import type { ResponseBody } from './ResponseBody';

export type ChartPeriod = '1h' | '1d' | '1w' | '1m' | '1y' | 'max';

export interface Params {
  fungibleId: string;
  currency: string;
  addresses: string[];
  period: ChartPeriod;
}

export interface AssetChart {
  points: { timestamp: string; value: number; extra: null }[];
}

type Response = ResponseBody<AssetChart>;

export async function assetGetChart(
  this: ZerionApiContext,
  payload: Params,
  options: ClientOptions = CLIENT_DEFAULTS
) {
  return ZerionHttpClient.post<Response>({
    endpoint: '/asset/get-chart/v1',
    body: JSON.stringify(payload),
    ...options,
  });
}
