import React from 'react';

export function Surface({ style, ...props }: React.HTMLProps<HTMLDivElement>) {
  return (
    <div
      style={{
        borderRadius: 12,
        backgroundColor: 'var(--z-index-1)',
        ...style,
      }}
      {...props}
    />
  );
}
