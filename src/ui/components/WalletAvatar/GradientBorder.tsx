import React from 'react';

export function GradienBorder({
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
          <linearGradient
            id="premium-border-gradient-123"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="0%"
          >
            <stop offset="0%" stopColor="#3232DC" />
            <stop offset="50%" stopColor="#804CBA" />
            <stop offset="100%" stopColor="#FF7583" />
          </linearGradient>
        </defs>
        <rect
          id="gradient-border-rect"
          x="0px"
          y="0px"
          rx={borderRadius + strokeWidth}
          width={width + 3 * strokeWidth}
          height={height + 3 * strokeWidth}
          fill="transparent"
          stroke="url(#premium-border-gradient-123)"
          strokeWidth={strokeWidth}
        />
      </svg>
    </div>
  );
}
