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
        // @ts-ignore
        ['--surface-border-radius']: '12px',
        borderRadius: 'var(--surface-border-radius)',
        backgroundColor: 'var(--z-index-1)',
        padding,
        ...style,
      }}
      {...props}
    />
  );
}
