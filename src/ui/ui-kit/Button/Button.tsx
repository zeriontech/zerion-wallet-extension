import React from 'react';

export function Button({
  style,
  as = 'button',
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  as?: 'button' | any;
  to?: string;
}) {
  const Element = as;

  return (
    <Element
      style={{
        cursor: 'pointer',
        border: 'none',
        textDecoration: 'none',
        padding: '14px 48px',
        background: 'var(--actions-default)',
        borderRadius: 8,
        color: 'white',
        ...style,
      }}
      {...props}
    />
  );
}
