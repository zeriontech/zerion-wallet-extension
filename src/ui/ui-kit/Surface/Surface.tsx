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
        ['--local-surface-background-color']:
          'var(--surface-background-color, var(--z-index-1))',
        borderRadius: 'var(--surface-border-radius)',
        backgroundColor: 'var(--local-surface-background-color)',
        padding,
        ...style,
      }}
      {...props}
    />
  );
}
