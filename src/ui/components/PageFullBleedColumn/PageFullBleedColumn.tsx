import React from 'react';

export function PageFullBleedColumn({
  style,
  paddingInline,
  ...props
}: React.HTMLProps<HTMLDivElement> & { paddingInline: boolean }) {
  return (
    <div
      {...props}
      style={{
        marginInline: 'calc(-1 * var(--column-padding-inline))',
        paddingInline: paddingInline
          ? 'var(--column-padding-inline)'
          : undefined,
        ...style,
      }}
    />
  );
}
