import { useEffect, useMemo } from 'react';
import debounce from 'lodash/debounce';

export function useDebouncedCallback(
  callback: (...args: any) => any,
  delay: number
) {
  const debouncedCallback = useMemo(
    () => debounce(callback, delay),
    [callback, delay]
  );
  useEffect(() => {
    return debouncedCallback.cancel;
  }, [debouncedCallback.cancel]);
  return debouncedCallback;
}
