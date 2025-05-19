import type { AssetChartActions } from 'src/modules/zerion-api/requests/asset-get-chart';
import type {
  ChartPoint,
  ParsedChartPoint,
} from 'src/ui/components/chart/types';

export type ParsedAssetChartPoint = ParsedChartPoint<AssetChartActions | null>;
export type AssetChartPoint = ChartPoint<AssetChartActions | null>;
