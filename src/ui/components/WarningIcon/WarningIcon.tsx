import React from 'react';

const colors = {
  notice: { color: 'var(--notice-500)', glowColor: 'var(--notice-400)' },
  negative: { color: 'var(--negative-500)', glowColor: 'var(--negative-300)' },
} as const;

export function WarningIcon({
  glow = false,
  kind = 'notice',
  outlineStrokeWidth = 3,
  size = 22,
  borderWidth = '2px',
  style,
}: {
  kind?: 'notice' | 'negative';
  glow?: boolean;
  outlineStrokeWidth?: number;
  borderWidth?: string;
  size?: number;
  style?: React.CSSProperties;
}) {
  const { color, glowColor } = colors[kind];
  return (
    <div
      style={{
        userSelect: 'none',
        width: size - outlineStrokeWidth * 2,
        height: size - outlineStrokeWidth * 2,
        borderRadius: '50%',
        color,
        border: `${borderWidth} solid ${color}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: size >= 44 ? 20 : 12,
        fontWeight: size >= 44 ? 500 : undefined,
        margin: glow ? outlineStrokeWidth : undefined,
        boxShadow: glow
          ? `0 0 0px ${outlineStrokeWidth}px ${glowColor}`
          : undefined,
        ...style,
      }}
    >
      !
    </div>
  );
}
