import React from 'react';

export function Surface({
  style,
  padding,
  ...props
}: React.HTMLProps<HTMLDivElement> & {
  padding?: React.CSSProperties['padding'];
}) {
  return (
    <div
      style={{
        borderRadius: 12,
        backgroundColor: 'var(--z-index-1)',
        padding,
        ...style,
      }}
      {...props}
    />
  );
}
