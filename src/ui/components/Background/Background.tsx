import React, { useEffect } from 'react';

export function Background({
  children,
  backgroundColor,
  backgroundKind,
}: React.HTMLAttributes<HTMLDivElement> & {
  backgroundColor?: React.CSSProperties['backgroundColor'];
  backgroundKind?: 'neutral' | 'white';
}) {
  useEffect(() => {
    if (!backgroundKind) {
      return;
    }
    const className = backgroundKind === 'neutral' ? 'neutral-bg' : 'white-bg';
    document.body.classList.add(className);
    return () => {
      document.body.classList.remove(className);
    };
  }, [backgroundKind]);
  useEffect(() => {
    if (!backgroundColor) {
      return;
    }
    const previousValue = document.body.style.getPropertyValue('--background');
    document.body.style.backgroundColor = backgroundColor;
    return () => {
      document.body.style.backgroundColor = previousValue;
    };
  }, [backgroundColor]);

  return children as JSX.Element;
}
