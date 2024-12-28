import React, { useMemo } from 'react';

interface BlurPixelsProps {
  color?: 'neutral' | 'positive' | 'negative' | 'primary';
  // kind?: Kind;
  height?: number;
  pixelsProportion?: number;
}
interface BlurrableTextProps extends BlurPixelsProps {
  children: React.ReactNode;
}

function randomIntFromInterval(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

const getColorArray = (n: number, color: BlurrableTextProps['color']) => {
  return [...Array(n * 2).keys()].map(
    () => `var(--${color}-${randomIntFromInterval(1, 4) * 100})`
  );
};

export function BlurWithPixels({
  color = 'neutral',
  // kind,
  height,
  pixelsProportion = 90,
}: BlurPixelsProps) {
  const rowLength = useMemo(() => randomIntFromInterval(4, 6), []);
  const pixelsColors = useMemo(
    () => getColorArray(rowLength, color),
    [color, rowLength]
  );
  // const gridHeight = height || (kind ? textParams[kind][1] : '1em');
  const gridHeight = height || '1em';

  return (
    <span
      title="Toggle Balance - ⇧H"
      style={{
        height: gridHeight,
        fontSize: gridHeight,
        lineHeight: 1,
        display: 'inline-flex',
        alignItems: 'center',
        position: 'relative',
        bottom: -2,
      }}
    >
      <svg
        height="1em"
        width={`${rowLength * 0.5}em`}
        style={{
          borderRadius: '0.25em',
          fontSize: `${pixelsProportion / 100}em`,
        }}
      >
        {pixelsColors.map((color, index) => (
          <rect
            key={index}
            height="0.5em"
            width="0.5em"
            fill={color}
            x={`${(index % rowLength) * 0.5}em`}
            y={index < rowLength ? '0' : '0.5em'}
          />
        ))}
      </svg>
    </span>
  );
}
