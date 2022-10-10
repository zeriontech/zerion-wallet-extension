import debounce from 'lodash/debounce';
import { useEffect, useRef, useState } from 'react';

export function useStaleTime(value: unknown, staleTime: number) {
  const [isStale, setIsStale] = useState(false);

  const valueRef = useRef(value);
  valueRef.current = value;

  const debouncedRef = useRef<() => void>();
  if (!debouncedRef.current) {
    debouncedRef.current = debounce(() => {
      setIsStale(true);
    }, staleTime);
  }

  useEffect(() => {
    setIsStale(false);
    debouncedRef.current?.();
  }, [value]);
  return { isStale };
}
