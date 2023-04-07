import React from 'react';
import { PAGE_PADDING_HORIZONTAL } from '../PageColumn';

export function PageFullBleedColumn({
  style,
  paddingInline,
  ...props
}: React.HTMLProps<HTMLDivElement> & { paddingInline: boolean }) {
  return (
    <div
      {...props}
      style={{
        marginLeft: 0 - PAGE_PADDING_HORIZONTAL,
        marginRight: 0 - PAGE_PADDING_HORIZONTAL,
        paddingInline: paddingInline ? PAGE_PADDING_HORIZONTAL : undefined,
        ...style,
      }}
    />
  );
}
