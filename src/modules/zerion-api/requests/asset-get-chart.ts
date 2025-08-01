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

export type AssetChartActionDirection = 'in' | 'out' | null;

type AssetChartAction = {
  type: 'sell' | 'buy' | null;
  direction: AssetChartActionDirection;
  quantity: string;
  value: number;
};

export type AssetChartActions = {
  count: number;
  total: AssetChartAction;
  preview: AssetChartAction[];
};

export interface AssetChart {
  points: Array<{
    timestamp: number;
    value: number;
    actions: AssetChartActions | null;
  }>;
}

type Response = ResponseBody<AssetChart>;

export async function assetGetChart(
  this: ZerionApiContext,
  payload: Params,
  options: ClientOptions = CLIENT_DEFAULTS
) {
  const kyOptions = this.getKyOptions();
  return ZerionHttpClient.post<Response>(
    {
      endpoint: 'asset/get-fungible-chart/v1',
      body: JSON.stringify(payload),
      ...options,
    },
    kyOptions
  );
}
