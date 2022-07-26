import React from 'react';
import { LinkProps, Link } from 'react-router-dom';

export function UnstyledLink({ style, ...props }: LinkProps) {
  return (
    <Link
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
