import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useEvent } from '../useEvent';

export function useSearchParamsObj<
  T extends Record<string, string | undefined>
>() {
  const [searchParams, setSearchParams] = useSearchParams();
  const value = useMemo(() => {
    return Object.fromEntries(searchParams) as Partial<T>;
  }, [searchParams]);
  // setSearchParams is not a stable reference: https://github.com/remix-run/react-router/issues/9304
  const setSearchParamsStable = useEvent(setSearchParams);
  const setValue = useCallback(
    (setStateAction: (value: T) => T) => {
      setSearchParamsStable(
        (current) => {
          const asObj = Object.fromEntries(current) as T;
          const value = setStateAction(asObj);
          for (const key in asObj) {
            // TODO: Investigate — using `for (const key of current.keys())` doesn't iterate over all keys found in obj??
            current.delete(key);
          }
          for (const key in value) {
            const newVal = value[key as keyof typeof value];
            if (newVal) {
              current.set(key, newVal);
            }
          }
          return new URLSearchParams(current);
        },
        { replace: true }
      );
    },
    [setSearchParamsStable]
  );
  return [value, setValue] as const;
}
