import { type AssetChartPointExtra } from 'src/modules/zerion-api/requests/asset-get-chart';

export type ChartPoint = [number, number, AssetChartPointExtra];
export type ParsedChartPoint =
  | {
      x: number;
      y: number;
      extra: AssetChartPointExtra;
    }
  | undefined;
