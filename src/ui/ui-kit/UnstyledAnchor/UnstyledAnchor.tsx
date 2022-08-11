import React from 'react';

export function UnstyledAnchor({
  style,
  ...props
}: React.AnchorHTMLAttributes<HTMLAnchorElement>) {
  return (
    <a
      style={{
        textDecoration: 'inherit',
        color: 'inherit',
        fontFamily: 'inherit',
        ...style,
      }}
      {...props}
    />
  );
}
