import React from 'react';
import { PAGE_PADDING_INLINE } from '../PageColumn';

export function PageFullBleedColumn({
  style,
  paddingInline,
  ...props
}: React.HTMLProps<HTMLDivElement> & { paddingInline: boolean }) {
  return (
    <div
      {...props}
      style={{
        marginInline: 0 - PAGE_PADDING_INLINE,
        paddingInline: paddingInline ? PAGE_PADDING_INLINE : undefined,
        ...style,
      }}
    />
  );
}
