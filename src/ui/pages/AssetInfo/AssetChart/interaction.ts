import type { InteractionItem, InteractionModeFunction } from 'chart.js/auto';
import { Interaction } from 'chart.js/auto';
import { getRelativePosition } from 'chart.js/helpers';
import type { ParsedAssetChartPoint } from './types';

declare module 'chart.js' {
  interface InteractionModeMap {
    magneticActions: InteractionModeFunction;
  }
}

function getDistance(
  point1: { x: number; y: number },
  point2: { x: number; y: number }
) {
  return Math.sqrt(
    Math.pow(point2.x - point1.x, 2) + Math.pow(point2.y - point1.y, 2)
  );
}

Interaction.modes.magneticActions = function (chart, e) {
  const indexPoints = Interaction.modes.index(chart, e, {
    axis: 'x',
    intersect: false,
  });
  const activePoint = indexPoints[0];

  if (!activePoint) {
    return [];
  }

  const marneticRadius = 4;
  let closestPointWithExtra: InteractionItem | null = null;
  const position = getRelativePosition(e, chart);

  Interaction.evaluateInteractionItems(
    chart,
    'xy',
    position,
    (element, datasetIndex, index) => {
      if (Math.abs(element.x - position.x) > marneticRadius) {
        return;
      }
      if (
        'raw' in element &&
        Boolean((element.raw as ParsedAssetChartPoint)?.extra)
      ) {
        if (!closestPointWithExtra) {
          closestPointWithExtra = {
            element,
            datasetIndex,
            index,
          };
        } else if (
          Math.abs(element.x - position.x) <
          Math.abs(closestPointWithExtra.element.x - position.x)
        ) {
          closestPointWithExtra = {
            element,
            datasetIndex,
            index,
          };
        }
      }
    }
  );

  const activePointMagneticRadius = 8;
  if (
    !closestPointWithExtra ||
    getDistance(position, activePoint.element) < activePointMagneticRadius
  ) {
    return [activePoint];
  }

  return [closestPointWithExtra];
};
