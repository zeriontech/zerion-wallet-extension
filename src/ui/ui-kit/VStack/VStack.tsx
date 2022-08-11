import React from 'react';

export const VStack = ({
  gap,
  style,
  ...props
}: {
  gap: number;
} & React.HTMLProps<HTMLDivElement>) => {
  return (
    <div
      style={{
        display: 'grid',
        gridGap: gap,
        gridTemplateColumns: 'minmax(0, auto)',
        ...style,
      }}
      {...props}
    />
  );
};
