import React from 'react';
import WarningIconTrimmed from 'jsx:src/ui/assets/warning-icon-trimmed.svg';

const colors = {
  notice: {
    color: 'var(--notice-500)',
    glowColor: 'var(--notice-300)',
    innerGlowColor: 'var(--notice-200)',
  },
  negative: {
    color: 'var(--negative-500)',
    glowColor: 'var(--negative-300)',
    innerGlowColor: 'var(--negative-200)',
  },
  neutral: {
    color: 'var(--black)',
    glowColor: 'var(--neutral-400)',
    innerGlowColor: 'var(--neutral-200)',
  },
} as const;

export function WarningIcon({
  glow = false,
  kind = 'notice',
  outlineStrokeWidth = 3,
  size = 22,
  style,
}: {
  kind?: keyof typeof colors;
  glow?: boolean;
  outlineStrokeWidth?: number;
  borderWidth?: string;
  size?: number;
  style?: React.CSSProperties;
}) {
  const { color, glowColor, innerGlowColor } = colors[kind];
  const iconSize = size - outlineStrokeWidth * 2;
  return (
    <div
      style={{
        userSelect: 'none',
        width: iconSize,
        height: iconSize,
        borderRadius: '50%',
        color,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: glow ? outlineStrokeWidth : undefined,
        backgroundColor: glow ? innerGlowColor : undefined,
        boxShadow: glow
          ? `0 0 0px ${outlineStrokeWidth}px ${glowColor}`
          : undefined,
        ...style,
      }}
    >
      <WarningIconTrimmed style={{ width: iconSize, height: iconSize }} />
    </div>
  );
}
