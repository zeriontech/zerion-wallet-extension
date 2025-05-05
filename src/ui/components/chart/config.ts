import type { ChartConfiguration } from 'chart.js/auto';

export const CHART_HEIGHT = 160;
export const CHART_ANIMATION_DURATION = 500;

export const DEFAULT_CONFIG: ChartConfiguration<'scatter'> = {
  type: 'scatter',
  data: {
    datasets: [],
  },
  options: {
    events: ['mousemove', 'mouseout', 'mousedown', 'mouseup'],
    showLine: true,
    responsive: true,
    maintainAspectRatio: false,
    transitions: {
      show: {
        animations: {
          y: {
            from: CHART_HEIGHT,
          },
          colors: {
            type: 'color',
            from: 'transparent',
          },
        },
      },
      hide: {
        animations: {
          colors: {
            type: 'color',
            to: 'transparent',
          },
        },
      },
    },
    interaction: {
      intersect: false,
      mode: 'index',
    },
    animations: {
      updateAxis: {
        duration: CHART_ANIMATION_DURATION,
      },
    },
    scales: {
      x: {
        display: false,
      },
      y: {
        display: false,
      },
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        enabled: false,
        callbacks: {
          label: ({ parsed }) => {
            return `Value: ${parsed.y}`;
          },
        },
      },
    },
    elements: {
      point: {
        radius: 0,
        hoverRadius: 0,
      },
      line: {
        borderWidth: 2,
        cubicInterpolationMode: 'monotone',
        spanGaps: true,
      },
    },
  },
};
