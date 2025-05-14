import type { ChartConfiguration, Plugin } from 'chart.js/auto';

export type ChartPoint<T = unknown> = [number, number, T];
export type ParsedChartPoint<T = unknown> =
  | {
      x: number;
      y: number;
      extra: T;
    }
  | undefined;

export type ChartTooltipOptions = NonNullable<
  NonNullable<ChartConfiguration<'scatter'>['options']>['plugins']
>['tooltip'];
export type ChartDatasetConfig = Partial<
  ChartConfiguration<'scatter'>['data']['datasets'][number]
>;
export type ChartPlugins = Array<Plugin<'scatter'>>;
export type ChartInteraction = NonNullable<
  ChartConfiguration<'scatter'>['options']
>['interaction'];
