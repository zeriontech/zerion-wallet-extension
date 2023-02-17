import React from 'react';
import { Surface } from 'src/ui/ui-kit/Surface';

export function ItemSurface({
  style,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  const surfaceStyle = {
    ...style,
    padding: '10px 12px',
  };
  return <Surface style={surfaceStyle} {...props} />;
}
