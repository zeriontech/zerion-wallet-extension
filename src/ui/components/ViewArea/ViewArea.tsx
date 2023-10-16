import React from 'react';

export function ViewArea(props: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...props}
      style={{
        height: '100%',
        minHeight: 'inherit',
        display: 'flex',
        flexDirection: 'column',
        marginRight: 'auto',
        marginLeft: 'auto',
      }}
    />
  );
}
