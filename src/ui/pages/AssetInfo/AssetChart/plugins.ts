import type { Plugin, Point } from 'chart.js/auto';
import { Theme } from 'src/ui/features/appearance';
import { getChartColor, getSortedRangeIndexes } from './helpers';

export function drawCrossPlugin({
  getStartRangeIndex,
  getTheme,
}: {
  getStartRangeIndex: () => number | null;
  getTheme: () => Theme;
}): Plugin<'scatter'> {
  return {
    id: 'drawCross',
    afterDraw: (chart) => {
      const activeElement = chart.getActiveElements()?.[0];
      const { ctx } = chart;

      if (!activeElement || !ctx) {
        return;
      }

      const { x, y } = activeElement.element.tooltipPosition(false);
      const { data } = chart.data.datasets[0];
      const { startRangeIndex, endRangeIndex } = getSortedRangeIndexes({
        startRangeIndex: getStartRangeIndex(),
        endRangeIndex: activeElement.index,
      });
      const endRangeValue = (data.at(endRangeIndex ?? -1) as Point)?.y || 0;
      const startRangeValue = (data[startRangeIndex ?? 0] as Point)?.y || 0;

      const color = getChartColor({
        theme: getTheme(),
        isPositive: endRangeValue >= startRangeValue,
        isHighlighted: false,
      });

      ctx.save();
      // ctx.setLineDash([5, 5]);

      // if (getStartRangeX() == null) {
      // Draw vertical line
      //   ctx.beginPath();
      //   ctx.moveTo(x, 8);
      //   ctx.lineTo(x, chart.height - 2);
      //   ctx.strokeStyle = 'grey';
      //   ctx.lineWidth = 1;
      //   ctx.stroke();
      //   ctx.closePath();
      // }

      // Draw horizontal line
      // ctx.beginPath();
      // ctx.moveTo(0, y);
      // ctx.lineTo(chart.width, y);
      // ctx.strokeStyle = 'grey';
      // ctx.lineWidth = 1;
      // ctx.stroke();
      // ctx.closePath();

      // ctx.setLineDash([]);

      // Draw circle
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, 2 * Math.PI);
      ctx.fillStyle = color;
      ctx.strokeStyle = 'white';
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
