import React from 'react';

export function GradientBorder({
  borderColor,
  borderWidth,
  borderRadius,
  backgroundColor,
  children,
}: {
  borderColor: string;
  borderWidth: number;
  borderRadius: number;
  backgroundColor: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        background: borderColor,
        borderRadius,
        padding: borderWidth,
      }}
    >
      <div
        style={{ borderRadius: borderRadius - borderWidth, backgroundColor }}
      >
        {children}
      </div>
    </div>
  );
}
