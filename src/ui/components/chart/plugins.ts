import type { Plugin } from 'chart.js/auto';
import { Theme } from 'src/ui/features/appearance';

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
