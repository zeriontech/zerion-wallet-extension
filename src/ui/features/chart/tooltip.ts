import { type TooltipOptions, type Chart } from 'chart.js';

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

const getSingleItemTooltip = (title: string) => {
  return `<div style="padding: 8px 12px; background-color: var(--background-transparent); border-radius: 12px; color: var(--white);">
    <div style="font-weight: 500">
      <span>Sell</span>
      <span style="color: var(--positive-400); margin-left: 4px">$12.23</span>
    </div>
    <div>${title}</div>
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

    if (!bodyLines[0][0]) {
      tooltipEl.style.opacity = '0';
      tooltipEl.style.filter = 'blur(4px)';
      tooltipEl.innerHTML = '';
      return;
    }

    tooltipEl.innerHTML = getSingleItemTooltip(bodyLines[0][0]);
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
