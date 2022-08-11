import React from 'react';

export function FillView({
  style,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      style={{
        ...style,
        height: '100%',
        flexGrow: 1,
        display: 'grid',
        placeItems: 'center',
        placeContent: 'center',
      }}
      {...props}
    />
  );
}
