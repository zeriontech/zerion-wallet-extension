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
