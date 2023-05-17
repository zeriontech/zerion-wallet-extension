import React, { useCallback, useLayoutEffect, useState } from 'react';
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
  const [searchValue, setSearchValue] = useState(value);
  const debouncedSetSearchParams = useDebouncedCallback(
    useCallback((v: string) => onChange(v), [onChange]),
    300
  );

  useLayoutEffect(() => {
    setSearchValue(value);
  }, [value]);

  return (
    <SearchInput
      boxHeight={40}
      type="search"
      placeholder="Search"
      value={searchValue}
      onFocus={onFocus}
      onChange={(event) => {
        debouncedSetSearchParams(event.currentTarget.value);
        setSearchValue(event.currentTarget.value);
      }}
    />
  );
}
