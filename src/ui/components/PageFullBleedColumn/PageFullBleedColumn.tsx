import React from 'react';
import { PAGE_PADDING_HORIZONTAL } from '../PageColumn';

export function PageFullBleedColumn({
  style,
  padding,
  ...props
}: React.HTMLProps<HTMLDivElement> & { padding: boolean }) {
  return (
    <div
      {...props}
      style={{
        marginLeft: 0 - PAGE_PADDING_HORIZONTAL,
        marginRight: 0 - PAGE_PADDING_HORIZONTAL,
        paddingLeft: padding ? PAGE_PADDING_HORIZONTAL : undefined,
        paddingRight: padding ? PAGE_PADDING_HORIZONTAL : undefined,
        ...style,
      }}
    />
  );
}
