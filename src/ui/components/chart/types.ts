import { type AssetChartActions } from 'src/modules/zerion-api/requests/asset-get-chart';

export type ChartPoint = [number, number, AssetChartActions | null];
export type ParsedChartPoint =
  | {
      x: number;
      y: number;
      actions: AssetChartActions | null;
    }
  | undefined;
