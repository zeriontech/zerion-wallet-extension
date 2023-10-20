import React from 'react';

export function ViewArea({
  style,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...props}
      style={{
        minHeight: '100%',
        display: 'flex',
        flexDirection: 'column',
        marginRight: 'auto',
        marginLeft: 'auto',
        ...style,
      }}
    />
  );
}
