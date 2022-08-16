import React from 'react';
import { PAGE_PADDING_HORIZONTAL } from '../PageColumn';

export function PageFullBleedLine({
  lineColor = 'var(--neutral-200)',
  style,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { lineColor?: string }) {
  return (
    <div
      style={{
        height: 1,
        backgroundColor: lineColor,
        marginLeft: 0 - PAGE_PADDING_HORIZONTAL,
        marginRight: 0 - PAGE_PADDING_HORIZONTAL,
        ...style,
      }}
      {...props}
    ></div>
  );
}
