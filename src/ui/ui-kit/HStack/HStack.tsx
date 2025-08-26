import React from 'react';

export const HStack = React.forwardRef<
  HTMLDivElement,
  {
    gap: number;
    justifyContent?: React.CSSProperties['justifyContent'];
    alignItems?: React.CSSProperties['alignItems'];
  } & React.HTMLProps<HTMLDivElement>
>(
  (
    {
      gap,
      alignItems = 'initial',
      justifyContent = 'initial',
      style,
      ...props
    },
    ref
  ) => {
    return (
      <div
        style={{
          display: 'grid',
          gridAutoFlow: 'column',
          gridAutoColumns: 'minmax(min-content, max-content)',
          gridGap: gap,
          alignItems: alignItems || 'initial',
          justifyContent: justifyContent || 'initial',
          ...style,
        }}
        ref={ref}
        {...props}
      />
    );
  }
);
