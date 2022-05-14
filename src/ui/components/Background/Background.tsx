import React, { useEffect } from 'react';

export function Background({
  children,
  backgroundColor,
}: React.HTMLAttributes<HTMLDivElement> & {
  backgroundColor: React.CSSProperties['backgroundColor'];
}) {
  useEffect(() => {
    if (!backgroundColor) {
      return;
    }
    const previousValue = document.body.style.backgroundColor;
    document.body.style.backgroundColor = backgroundColor;
    return () => {
      document.body.style.backgroundColor = previousValue;
    };
  }, [backgroundColor]);

  return children as JSX.Element;
}
