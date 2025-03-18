import { useCallback, useState } from 'react';

export function useToggledValues<T>(initialValues: Set<T> | (() => Set<T>)) {
  const [values, setValues] = useState<Set<T>>(initialValues);
  const toggleValue = useCallback((value: T) => {
    setValues((set) => {
      const newSet = new Set(set);
      if (newSet.has(value)) {
        newSet.delete(value);
        return newSet;
      } else {
        return newSet.add(value);
      }
    });
  }, []);
  return [values, toggleValue] as const;
}
