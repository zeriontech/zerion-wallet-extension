import React, { useEffect, useLayoutEffect, useRef } from 'react';

export function useBodyStyle(style: React.CSSProperties) {
  const prevValuesRef = useRef<React.CSSProperties>({});

  useLayoutEffect(() => {
    for (const key in style) {
      if (key in prevValuesRef.current === false) {
        // @ts-ignore key is keyof CSSProperties
        prevValuesRef.current[key] = document.body.style[key];
      }
      // @ts-ignore key is keyof CSSProperties
      document.body.style[key] = style[key];
    }
  }, [style]);
  useLayoutEffect(() => {
    const prevValues = prevValuesRef.current;
    return () => {
      for (const key in prevValues) {
        // @ts-ignore key is keyof CSSProperties
        document.body.style[key] = prevValues[key];
      }
    };
  }, []);
}

const bgClassNames = {
  neutral: 'neutral-bg',
  white: 'white-bg',
  transparent: 'transparent-bg',
} as const;

export function Background({
  children,
  backgroundColor,
  backgroundKind,
}: React.HTMLAttributes<HTMLDivElement> & {
  backgroundColor?: React.CSSProperties['backgroundColor'];
  backgroundKind?: 'neutral' | 'white' | 'transparent';
}) {
  useEffect(() => {
    if (!backgroundKind) {
      return;
    }
    const className = bgClassNames[backgroundKind];
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
