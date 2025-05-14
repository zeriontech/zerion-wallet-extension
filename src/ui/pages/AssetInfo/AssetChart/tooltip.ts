import { type TooltipOptions, type Chart } from 'chart.js';
import type { AssetChartActions } from 'src/modules/zerion-api/requests/asset-get-chart';
import { createNode as r } from 'src/content-script/in-dapp-notifications/createNode';
import { deserializeAssetChartActions } from './helpers';

type ExternalTooltip = TooltipOptions<'scatter'>['external'];

const getOrCreateTooltip = (chart: Chart) => {
  let tooltipEl = chart.canvas.parentNode?.querySelector('.chartjs-tooltip') as
    | HTMLDivElement
    | undefined;

  if (!tooltipEl) {
    tooltipEl = document.createElement('div');
    tooltipEl.classList.add('chartjs-tooltip');
    tooltipEl.style.opacity = '1';
    tooltipEl.style.pointerEvents = 'none';
    tooltipEl.style.position = 'absolute';
    tooltipEl.style.fontSize = '12px';
    tooltipEl.style.letterSpacing = '0.38px';
    tooltipEl.style.whiteSpace = 'nowrap';
    tooltipEl.style.transition = 'opacity 0.3s ease-in-out, filter 0.2s';
    tooltipEl.style.filter = 'blur(0px)';

    chart.canvas.parentNode?.appendChild(tooltipEl);
  }

  return tooltipEl;
};

type TooltipBodyItem = {
  title: string;
  balance: string;
  value: string;
  direction: AssetChartActions['total']['direction'];
};

const getItemColor = (direction: AssetChartActions['total']['direction']) => {
  return direction === 'in'
    ? 'var(--positive-500)'
    : direction === 'out'
    ? 'var(--negative-500)'
    : undefined;
};

const getSingleItemTooltip = ({ item }: { item: TooltipBodyItem }) => {
  return r(
    'div',
    {
      style:
        'padding: 8px 12px; background-color: var(--background-transparent); border-radius: 12px; color: var(--white); font-size: 12px; letter-spacing: 0.38px',
    },
    r(
      'div',
      { style: 'font-weight: 500' },
      r('span', null, item.title),
      r(
        'span',
        { style: `color: ${getItemColor(item.direction)}; margin-left: 4px` },
        item.balance
      )
    ),
    r('div', { style: 'font-weight: 400' }, item.value)
  );
};

const getMultipleItemsTooltip = ({
  items,
  total,
  count,
}: {
  items: TooltipBodyItem[];
  total: TooltipBodyItem;
  count: number;
}) => {
  return r(
    'div',
    {
      style:
        'padding: 8px 12px; background-color: var(--background-transparent); border-radius: 12px; color: var(--white); font-size: 12px; letter-spacing: 0.38px;',
    },
    ...items.map((item) =>
      r(
        'div',
        {
          style:
            'font-weight: 500; margin-bottom: 4px; display: flex; justify-content: space-between; width: 100%; gap: 4px',
        },
        r('div', null, item.title),
        r(
          'div',
          null,
          r(
            'span',
            { style: `color: ${getItemColor(item.direction)}` },
            item.balance
          ),
          r(
            'span',
            { style: 'font-weight: 400; padding-left: 4px' },
            item.value
          )
        )
      )
    ),
    count
      ? r(
          'div',
          { style: 'color: var(--neutral-500)' },
          `+${count} item${count > 1 ? 's' : ''}`
        )
      : null,
    r('div', {
      style:
        'width: 100%; height: 1px; margin-block: 8px; background-color: var(--neutral-500)',
    }),
    r(
      'div',
      {
        style:
          'font-weight: 500; margin-bottom: 4px; display: flex; justify-content: space-between; width: 100%; gap: 4px',
      },
      r('div', null, 'Total'),
      r(
        'div',
        null,
        r('span', null, total.balance),
        r('span', { style: 'font-weight: 400; padding-left: 4px' }, total.value)
      )
    )
  );
};

/*
  External tooltip takes the data from the tooltip callbacks.
  Special format of data serialisation is used to pass all the data to the tooltip.

  - title: total action data
  - beforeBody: total actions count
  - body: preview actions data
*/

export const externalTooltip: ExternalTooltip = ({ chart, tooltip }) => {
  const tooltipEl = getOrCreateTooltip(chart);

  if (tooltip.opacity === 0) {
    tooltipEl.style.opacity = '0';
    tooltipEl.style.filter = 'blur(4px)';
    tooltipEl.innerHTML = '';
    return;
  }

  if (tooltip.body) {
    const totalAction = tooltip.title[0];
    const totalActionsCount = Number(tooltip.beforeBody[0]);
    const previewActions = tooltip.body.map((b) => b.lines)[0];

    if (!totalAction) {
      tooltipEl.style.opacity = '0';
      tooltipEl.style.filter = 'blur(4px)';
      tooltipEl.innerHTML = '';
      return;
    }

    if (totalActionsCount === 1) {
      tooltipEl.replaceChildren(
        getSingleItemTooltip({
          item: deserializeAssetChartActions(totalAction),
        })
      );
    } else {
      tooltipEl.replaceChildren(
        getMultipleItemsTooltip({
          count: totalActionsCount - previewActions.length,
          total: deserializeAssetChartActions(totalAction),
          items: previewActions.map((item) =>
            deserializeAssetChartActions(item)
          ),
        })
      );
    }
  }

  const { offsetLeft: positionX, offsetTop: positionY } = chart.canvas;

  const inRightHalf = chart.width / 2 < tooltip.caretX;
  const inTheMiddle =
    chart.width * 0.3 < tooltip.caretX && tooltip.caretX < chart.width * 0.7;

  tooltipEl.style.opacity = '1';
  tooltipEl.style.left = positionX + tooltip.caretX + 'px';
  tooltipEl.style.top = positionY + tooltip.caretY + 'px';
  tooltipEl.style.filter = 'blur(0px)';
  tooltipEl.style.transform = inTheMiddle
    ? 'translate(-50%, 8px)'
    : inRightHalf
    ? 'translate(calc(-100% - 8px), -8px)'
    : 'translate(8px, -8px)';
};
