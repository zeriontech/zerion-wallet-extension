import React, { useCallback, useLayoutEffect, useRef } from 'react';
import { useDebouncedCallback } from 'src/ui/shared/useDebouncedCallback';
import { SearchInput } from 'src/ui/ui-kit/Input/SearchInput';

export function ActionSearch({
  value,
  onFocus,
  onChange,
}: {
  value?: string;
  onFocus: React.FocusEventHandler<HTMLInputElement>;
  onChange(value: string): void;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const debouncedHandleChange = useDebouncedCallback(
    useCallback((v: string) => onChange(v), [onChange]),
    300
  );

  useLayoutEffect(() => {
    if (inputRef.current) {
      inputRef.current.value = value || '';
    }
  }, [value]);

  return (
    <SearchInput
      ref={inputRef}
      boxHeight={40}
      type="search"
      placeholder="Search"
      defaultValue={value}
      onFocus={onFocus}
      onChange={(event) => {
        debouncedHandleChange(event.currentTarget.value);
      }}
    />
  );
}
