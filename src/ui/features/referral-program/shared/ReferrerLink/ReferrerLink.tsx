import React from 'react';
import { getWalletDisplayName } from 'src/ui/shared/getWalletDisplayName';
import { TextAnchor } from 'src/ui/ui-kit/TextAnchor';

export function ReferrerLink({
  handle,
  address,
  ...props
}: React.AnchorHTMLAttributes<HTMLAnchorElement> & {
  handle: string | null;
  address: string;
}) {
  const displayName = getWalletDisplayName({
    name: handle,
    address,
  });

  return (
    <TextAnchor
      href={`https://app.zerion.io/${address}/overview`}
      target="_blank"
      rel="noopener noreferrer"
      style={{ overflowWrap: 'anywhere' }}
      {...props}
    >
      {displayName}
    </TextAnchor>
  );
}
