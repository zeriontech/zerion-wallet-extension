import React from 'react';

export const HStack = ({
  gap,
  alignItems = 'initial',
  justifyContent = 'initial',
  style,
  ...props
}: {
  gap: number;
  justifyContent?: React.CSSProperties['justifyContent'];
  alignItems?: React.CSSProperties['alignItems'];
} & React.HTMLProps<HTMLDivElement>) => {
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
      {...props}
    />
  );
};
