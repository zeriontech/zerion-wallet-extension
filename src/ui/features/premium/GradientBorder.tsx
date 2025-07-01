import React, { useId } from 'react';

export function GradientBorder({
  width,
  height,
  borderRadius,
  strokeWidth = 2,
}: {
  width: number;
  height: number;
  borderRadius: number;
  strokeWidth?: number;
}) {
  const gradientId = useId();

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        pointerEvents: 'none',
        display: 'flex',
      }}
    >
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#3232DC" />
            <stop offset="50%" stopColor="#804CBA" />
            <stop offset="100%" stopColor="#FF7583" />
          </linearGradient>
        </defs>
        <g>
          <rect
            x={strokeWidth / 2}
            y={strokeWidth / 2}
            rx={borderRadius - strokeWidth / 2}
            width={width - strokeWidth}
            height={height - strokeWidth}
            strokeWidth={strokeWidth}
            fill="transparent"
            stroke={`url(#${gradientId})`}
          />
        </g>
      </svg>
    </div>
  );
}
