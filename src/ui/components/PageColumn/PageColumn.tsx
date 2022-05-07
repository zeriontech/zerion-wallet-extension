import React from 'react';

export function PageColumn({
  style,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      style={{
        paddingLeft: 16,
        paddingRight: 16,
        flexGrow: 1,
        display: 'flex',
        flexDirection: 'column',
        ...style,
      }}
      {...props}
    />
  );
}
