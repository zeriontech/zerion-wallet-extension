import React from 'react';

const colors = {
  notice: { color: 'var(--notice-500)', glowColor: 'var(--notice-400)' },
  negative: { color: 'var(--negative-500)', glowColor: 'var(--negative-300)' },
} as const;

export function WarningIcon({
  glow = false,
  kind = 'notice',
  style,
}: {
  kind?: 'notice' | 'negative';
  glow?: boolean;
  style?: React.CSSProperties;
}) {
  const { color, glowColor } = colors[kind];
  const glowWidth = 3;
  return (
    <div
      style={{
        userSelect: 'none',
        width: 16,
        height: 16,
        borderRadius: '50%',
        color,
        border: `2px solid ${color}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 12,
        margin: glow ? glowWidth : undefined,
        boxShadow: glow ? `0 0 0px ${glowWidth}px ${glowColor}` : undefined,
        ...style,
      }}
    >
      !
    </div>
  );
}
