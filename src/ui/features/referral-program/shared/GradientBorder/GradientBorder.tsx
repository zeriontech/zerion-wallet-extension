import React from 'react';

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
  return (
    <div
      style={{
        position: 'absolute',
        top: -2 * strokeWidth,
        left: -2 * strokeWidth,
        pointerEvents: 'none',
      }}
    >
      <svg
        width={width + 4 * strokeWidth}
        height={height + 4 * strokeWidth}
        viewBox={`${strokeWidth * -0.5} ${strokeWidth * -0.5} ${
          width + 4 * strokeWidth
        } ${height + 4 * strokeWidth}`}
      >
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#3232DC" />
            <stop offset="50%" stopColor="#804CBA" />
            <stop offset="100%" stopColor="#FF7583" />
          </linearGradient>
        </defs>
        <g>
          <rect
            x="0px"
            y="0px"
            rx={borderRadius + strokeWidth}
            width={width + 3 * strokeWidth}
            height={height + 3 * strokeWidth}
            fill="transparent"
            stroke="url(#gradient)"
            strokeWidth={strokeWidth}
          />
        </g>
      </svg>
    </div>
  );
}
