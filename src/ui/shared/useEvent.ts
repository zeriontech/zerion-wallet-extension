import { useLayoutEffect, useRef, useCallback } from 'react';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyFunction = (...args: any[]) => any;

export function useEvent<T extends AnyFunction>(callback: T) {
  const ref = useRef<T | null>(null);
  useLayoutEffect(() => {
    ref.current = callback;
  });
  return useCallback<AnyFunction>((...args) => {
    return ref.current?.(...args);
  }, []) as T;
}
