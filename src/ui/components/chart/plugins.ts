import type { Plugin } from 'chart.js/auto';
import { Theme } from 'src/ui/features/appearance';
import { getChartColor } from './helpers';
import type { ParsedChartPoint } from './types';

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
          ? (activeElement.element.raw as ParsedChartPoint)?.actions?.total
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
      ctx.strokeStyle = getTheme() === Theme.light ? '#fff' : '#16161a';
      ctx.lineWidth = 2;
      ctx.fill();
      ctx.stroke();
      ctx.closePath();

      ctx.restore();
    },
  };
}

export function drawRangePlugin({
  getStartRangeX,
  getTheme,
}: {
  getStartRangeX: () => number | null;
  getTheme: () => Theme;
}): Plugin<'scatter'> {
  return {
    id: 'drawRange',
    afterDraw: (chart) => {
      const activeElement = chart.getActiveElements()?.[0];
      const { ctx } = chart;
      const startRangeX = getStartRangeX();
      const theme = getTheme();

      if (!activeElement || !ctx || !startRangeX) {
        return;
      }

      const { x } = activeElement.element.tooltipPosition(false);

      ctx.save();

      // Fill background between clickedX and x
      ctx.beginPath();
      ctx.moveTo(startRangeX, 0);
      ctx.lineTo(startRangeX, chart.height);
      ctx.lineTo(x, chart.height);
      ctx.lineTo(x, 0);
      ctx.closePath();
      ctx.fillStyle =
        theme === Theme.light
          ? 'rgba(0, 0, 0, 0.1)'
          : 'rgba(255, 255, 255, 0.1)';
      ctx.fill();

      ctx.restore();
    },
  };
}
