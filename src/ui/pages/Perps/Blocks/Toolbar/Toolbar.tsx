import React from 'react';
import { getPerpIconUrl } from 'src/modules/hyperliquid/getPerpIconUrl';
import { HStack } from 'src/ui/ui-kit/HStack';
import { TokenIcon } from 'src/ui/ui-kit/TokenIcon';
import { UIText } from 'src/ui/ui-kit/UIText';

export function Toolbar({
  coin,
  displayName,
  className,
  style,
}: {
  coin: string;
  displayName: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <HStack gap={12} alignItems="center" className={className} style={style}>
      <TokenIcon
        src={getPerpIconUrl(coin)}
        symbol={displayName}
        size={32}
        style={{ borderRadius: 8 }}
      />
      <UIText kind="body/accent">{displayName}-PERP</UIText>
    </HStack>
  );
}

export function ToolbarSkeleton() {
  return (
    <HStack gap={12} alignItems="center">
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: '50%',
          backgroundColor: 'var(--neutral-200)',
        }}
      />
      <div
        style={{
          width: 80,
          height: 20,
          borderRadius: 4,
          backgroundColor: 'var(--neutral-200)',
        }}
      />
    </HStack>
  );
}
