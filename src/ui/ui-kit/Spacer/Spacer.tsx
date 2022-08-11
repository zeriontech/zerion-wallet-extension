import React from 'react';

export function Spacer({
  height,
  ...props
}: { height: number } & React.HTMLProps<HTMLDivElement>) {
  return <div style={{ height }} {...props} />;
}
