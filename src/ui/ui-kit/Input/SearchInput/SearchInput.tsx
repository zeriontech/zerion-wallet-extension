import React from 'react';
import SearchIcon from 'jsx:src/ui/assets/search.svg';
import type { InputProps } from '../Input';
import { Input } from '../Input';

export function SearchInput(props: InputProps) {
  return (
    <div style={{ position: 'relative' }}>
      <SearchIcon
        role="presentation"
        style={{
          pointerEvents: 'none',
          position: 'absolute',
          left: 12,
          top: 8,
          width: 24,
          height: 24,
          color: 'var(--neutral-500)',
        }}
      />
      <Input {...props} style={{ paddingLeft: 44 }} />
    </div>
  );
}
