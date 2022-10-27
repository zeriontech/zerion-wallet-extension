import React, { useContext, useEffect, useLayoutEffect, useRef } from 'react';
import { UIContext } from '../UIContext';

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
  const { uiScrollRootElement } = useContext(UIContext);
  useEffect(() => {
    if (!backgroundKind) {
      return;
    }
    const className = bgClassNames[backgroundKind];
    uiScrollRootElement.classList.add(className);
    return () => {
      uiScrollRootElement.classList.remove(className);
    };
  }, [backgroundKind, uiScrollRootElement.classList]);
  useEffect(() => {
    if (!backgroundColor) {
      return;
    }
    const previousValue =
      uiScrollRootElement.style.getPropertyValue('--background');
    uiScrollRootElement.style.backgroundColor = backgroundColor;
    return () => {
      uiScrollRootElement.style.backgroundColor = previousValue;
    };
  }, [backgroundColor, uiScrollRootElement.style]);

  return children as JSX.Element;
}
