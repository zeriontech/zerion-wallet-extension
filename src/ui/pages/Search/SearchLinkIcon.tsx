import React from 'react';
import SearchIcon from 'jsx:src/ui/assets/search.svg';
import { Button } from 'src/ui/ui-kit/Button';
import { UnstyledLink } from 'src/ui/ui-kit/UnstyledLink';

export function SearchLinkIcon() {
  return (
    <Button
      kind="ghost"
      as={UnstyledLink}
      size={36}
      to="/search"
      title="Search"
      style={{ paddingInline: 8 }}
    >
      <SearchIcon style={{ display: 'block', width: 20, height: 20 }} />
    </Button>
  );
}
