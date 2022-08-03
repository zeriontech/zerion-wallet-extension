import React, { useReducer } from 'react';
import { truncateAddress } from 'src/ui/shared/truncateAddress';
import { UnstyledButton } from 'src/ui/ui-kit/UnstyledButton';

export function AddressText({ address, as }: { address: string; as?: 'span' }) {
  const [collapsed, toggle] = useReducer((x) => !x, true);
  const isSpan = as === 'span';
  return collapsed ? (
    React.createElement(isSpan ? 'span' : UnstyledButton, {
      onClick: isSpan ? undefined : toggle,
      children: truncateAddress(address, 4),
    })
  ) : (
    <span>
      <span style={{ wordBreak: 'break-all' }}>{address}</span>{' '}
      <UnstyledButton onClick={toggle}>↤</UnstyledButton>
    </span>
  );
}
