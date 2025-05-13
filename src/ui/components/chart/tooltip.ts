import { type TooltipOptions, type Chart } from 'chart.js';
import type { AssetChartActions } from 'src/modules/zerion-api/requests/asset-get-chart';
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
  return `<div style="padding: 8px 12px; background-color: var(--background-transparent); border-radius: 12px; color: var(--white); font-size: 12px; letter-spacing: 0.38px;">
    <div style="font-weight: 500">
      <span>${item.title}</span>
      <span style="color: ${getItemColor(item.direction)}; margin-left: 2px">${
    item.balance
  }</span>
    </div>
    <div style="font-weight: 400">${item.value}</div>
  </div>`;
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
  return `<div style="padding: 8px 12px; background-color: var(--background-transparent); border-radius: 12px; color: var(--white); font-size: 12px; letter-spacing: 0.38px;">
    ${items
      .map(
        (
          item
        ) => `<div style="font-weight: 500; margin-bottom: 4px; display: flex; justify-content: space-between; width: 100%; gap: 4px">
      <span>${item.title}</span>
      <span>
      <span style="color: ${getItemColor(item.direction)}">${
          item.balance
        }</span>
       <span style="font-weight: 400">${item.value}</span>
       </span>
    </div>`
      )
      .join('')}
    ${
      count
        ? `<div style="color: var(--neutral-500);">+${count} item${
            count > 1 ? 's' : ''
          }</div>`
        : ''
    }
    <div style="width: 100%; height: 1px; margin-block: 8px; background-color: var(--neutral-500);"></div>
    <div style="font-weight: 500; margin-bottom: 4px; display: flex; justify-content: space-between; width: 100%; gap: 4px">
      <span>Total</span>
      <span>
      <span>${total.balance}</span>
      <span style="font-weight: 400">${total.value}</span>
      </span>
  </div>`;
};

export const externalTooltip: ExternalTooltip = ({ chart, tooltip }) => {
  // Tooltip Element
  const tooltipEl = getOrCreateTooltip(chart);

  // Hide if no tooltip
  if (tooltip.opacity === 0) {
    tooltipEl.style.opacity = '0';
    tooltipEl.style.filter = 'blur(4px)';
    tooltipEl.innerHTML = '';
    return;
  }

  // Set Text
  if (tooltip.body) {
    const bodyLines = tooltip.body.map((b) => b.lines);
    const footerLine = tooltip.footer;

    if (!bodyLines[0][0]) {
      tooltipEl.style.opacity = '0';
      tooltipEl.style.filter = 'blur(4px)';
      tooltipEl.innerHTML = '';
      return;
    }

    const actionCount = Number(footerLine[0]);

    if (actionCount === 1) {
      tooltipEl.innerHTML = getSingleItemTooltip({
        item: deserializeAssetChartActions(bodyLines[0][0]),
      });
    } else {
      tooltipEl.innerHTML = getMultipleItemsTooltip({
        count: actionCount - 2,
        total: deserializeAssetChartActions(bodyLines[0][0]),
        items: bodyLines[0]
          .slice(1)
          .map((item) => deserializeAssetChartActions(item)),
      });
    }
  }

  const { offsetLeft: positionX, offsetTop: positionY } = chart.canvas;

  const inRightHalf = chart.width / 2 < tooltip.caretX;

  // Display, position, and set styles for font
  tooltipEl.style.opacity = '1';
  tooltipEl.style.left = positionX + tooltip.caretX + 'px';
  tooltipEl.style.top = positionY + tooltip.caretY + 'px';
  tooltipEl.style.filter = 'blur(0px)';
  tooltipEl.style.transform = inRightHalf
    ? 'translate(calc(-100% - 16px), -50%)'
    : 'translate(16px, -50%)';
};
