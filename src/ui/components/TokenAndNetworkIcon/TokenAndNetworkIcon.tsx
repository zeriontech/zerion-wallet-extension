import React from 'react';
import { TokenIcon } from 'src/ui/ui-kit/TokenIcon';
import { NetworkIcon } from 'src/ui/components/NetworkIcon';

/**
 * A token icon with its network badged onto the bottom-right corner. The
 * composition was duplicated inline in the Swap and Send asset-selector
 * buttons; the deposit flow needs it at three more sizes.
 */
export function TokenAndNetworkIcon({
  size,
  symbol,
  iconUrl,
  networkIconUrl,
  networkName,
  /** Defaults to a proportion of `size` that matches the 32/14 pairing in Swap */
  networkIconSize = Math.round(size * 0.44),
  outlineWidth = 2,
  networkIconBorderRadius = 4,
  style,
}: {
  size: number;
  symbol: string;
  iconUrl: string | null;
  networkIconUrl: string | null;
  networkName: string;
  networkIconSize?: number;
  outlineWidth?: number;
  networkIconBorderRadius?: number;
  style?: React.CSSProperties;
}) {
  return (
    <div
      style={{
        position: 'relative',
        width: size,
        height: size,
        flexShrink: 0,
        ...style,
      }}
    >
      <TokenIcon src={iconUrl} symbol={symbol} size={size} />
      <div
        style={{
          position: 'absolute',
          bottom: -outlineWidth,
          right: -outlineWidth,
          borderRadius: networkIconBorderRadius,
          border: `${outlineWidth}px solid var(--white)`,
          overflow: 'hidden',
          lineHeight: 0,
          backgroundColor: 'var(--neutral-200)',
        }}
      >
        <NetworkIcon
          src={networkIconUrl}
          name={networkName}
          size={networkIconSize}
        />
      </div>
    </div>
  );
}
