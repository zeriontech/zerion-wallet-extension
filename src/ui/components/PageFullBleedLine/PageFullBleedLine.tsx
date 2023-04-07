import React from 'react';
import { PAGE_PADDING_INLINE } from '../PageColumn';

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
        marginInline: 0 - PAGE_PADDING_INLINE,
        ...style,
      }}
      {...props}
    ></div>
  );
}
