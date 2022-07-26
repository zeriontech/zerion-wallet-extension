import React from 'react';

export function NeutralDecimals({
  parts,
  neutralColor = 'var(--neutral-300)',
}: {
  parts: Intl.NumberFormatPart[];
  neutralColor?: string;
}) {
  return (
    <>
      {parts.map((part, index) => (
        <span
          key={index}
          style={
            part.type === 'decimal' || part.type === 'fraction'
              ? { color: neutralColor }
              : undefined
          }
        >
          {part.value}
        </span>
      ))}
    </>
  );
}
