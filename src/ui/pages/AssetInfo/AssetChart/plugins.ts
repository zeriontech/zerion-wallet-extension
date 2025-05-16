import type { Plugin } from 'chart.js/auto';
import { Theme } from 'src/ui/features/appearance';
import { getChartColor } from 'src/ui/components/chart/helpers';
import type { ParsedAssetChartPoint } from './types';

export function drawDotPlugin({
  getTheme,
}: {
  getTheme: () => Theme;
}): Plugin<'scatter'> {
  return {
    id: 'drawDot',
    afterDraw: (chart) => {
      const activeElement = chart.getActiveElements()?.[0];
      const { ctx } = chart;

      if (!activeElement || !ctx) {
        return;
      }

      const { x, y } = activeElement.element.tooltipPosition(false);

      const direction =
        'raw' in activeElement.element
          ? (activeElement.element.raw as ParsedAssetChartPoint)?.extra?.total
              .direction
          : null;
      const color =
        direction === 'in' || direction === 'out'
          ? getChartColor({
              isPositive: direction === 'in',
              theme: getTheme(),
              isHighlighted: false,
            })
          : getTheme() === Theme.light
          ? '#9c9fa8'
          : '#70737b';

      ctx.save();

      ctx.beginPath();
      ctx.arc(x, y, 6, 0, 2 * Math.PI);
      ctx.fillStyle = color;
      ctx.strokeStyle = getTheme() === Theme.light ? '#ffffff' : '#16161a';
      ctx.lineWidth = 2;
      ctx.fill();
      ctx.stroke();
      ctx.closePath();

      ctx.restore();
    },
  };
}

export function drawVerticalLinePlugin({
  getTheme,
}: {
  getTheme: () => Theme;
}): Plugin<'scatter'> {
  return {
    id: 'verticalLine',
    afterDraw: (chart) => {
      const activeElement = chart.getActiveElements()?.[0];
      const { ctx } = chart;

      if (!activeElement || !ctx) {
        return;
      }

      const { x, y } = activeElement.element.tooltipPosition(false);

      ctx.save();

      ctx.beginPath();
      ctx.moveTo(x, chart.chartArea.top);
      ctx.lineTo(x, y - 10);
      ctx.moveTo(x, y + 10);
      ctx.lineTo(x, chart.chartArea.bottom);
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = getTheme() === Theme.light ? '#e1e1e1' : '#4b4b4d';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.closePath();

      ctx.restore();
    },
  };
}

export function drawCapPointPlugin({
  getTheme,
}: {
  getTheme: () => Theme;
}): Plugin<'scatter'> {
  return {
    id: 'capPoint',
    afterDraw: (chart) => {
      const activeElement = chart.getActiveElements()?.[0];
      const { ctx } = chart;

      // If there is no active element, we don't need to draw the cap point
      if (!ctx || activeElement) {
        return;
      }

      const chartPoints = chart.data.datasets.at(0)
        ?.data as ParsedAssetChartPoint[];

      // Don't draw the cap point if last point has an action to show
      if (chartPoints.at(-1)?.extra) {
        return;
      }

      const pointColor = getChartColor({
        theme: getTheme(),
        isPositive:
          (chartPoints?.at(0)?.y || 0) <= (chartPoints?.at(-1)?.y || 0),
        isHighlighted: false,
      });

      const meta = chart.getDatasetMeta(0);
      const { x, y } = meta.data.at(-1) || {};

      if (x == null || y == null) {
        return;
      }

      ctx.save();

      ctx.beginPath();
      ctx.arc(x, y, 5, 0, 2 * Math.PI);
      ctx.fillStyle = pointColor;
      ctx.strokeStyle = 'transparent';
      ctx.fill();
      ctx.stroke();
      ctx.closePath();

      ctx.restore();
    },
  };
}
