import React from 'react';
import { NetworkIcon } from 'src/ui/components/NetworkIcon';
import { TokenIcon } from 'src/ui/ui-kit/TokenIcon';

export function SuccessStateToken({
  iconUrl,
  symbol,
  chainName,
  chainIconUrl,
}: {
  iconUrl: string | null;
  symbol: string;
  chainName?: string;
  chainIconUrl?: string;
}) {
  return (
    <div style={{ position: 'relative' }}>
      <TokenIcon
        size={72}
        src={iconUrl}
        symbol={symbol}
        style={{ borderRadius: '50%', border: '4px solid var(--white)' }}
      />
      {chainName ? (
        <div style={{ position: 'absolute', bottom: 0, right: 0 }}>
          <NetworkIcon
            size={32}
            style={{ borderRadius: 8, border: '2px solid var(--white)' }}
            name={chainName}
            src={chainIconUrl}
          />
        </div>
      ) : null}
    </div>
  );
}
