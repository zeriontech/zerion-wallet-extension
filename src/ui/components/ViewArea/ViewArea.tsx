import React from 'react';

export function ViewArea(props: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...props}
      style={{
        minHeight: '100%',
        maxWidth: 550,
        display: 'flex',
        flexDirection: 'column',
        marginRight: 'auto',
        marginLeft: 'auto',
      }}
    />
  );
}
