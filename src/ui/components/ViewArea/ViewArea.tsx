import React from 'react';

export function ViewArea(props: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...props}
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    />
  );
}
