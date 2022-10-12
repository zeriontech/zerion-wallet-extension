import React from 'react';

export function TitleWithLine({
  children,
  lineColor = 'currentcolor',
  gap = 8,
}: React.PropsWithChildren<{ lineColor?: string; gap?: number }>) {
  const line = (
    <div
      style={{
        position: 'relative',
        top: 1,
        height: 1,
        backgroundColor: lineColor,
      }}
    ></div>
  );
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr auto 1fr',
        gap,
        alignItems: 'center',
      }}
    >
      {line}
      {children}
      {line}
    </div>
  );
}
