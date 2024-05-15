import React from 'react';
import type { ChainId } from 'src/modules/ethereum/transactions/ChainId';
import { Image } from 'src/ui/ui-kit/MediaFallback';
import { UIText } from 'src/ui/ui-kit/UIText';

interface Props {
  src?: string | null;
  chainId: ChainId | null;
  size?: number;
  style?: React.CSSProperties;
  name: string | null;
}

function TextFallback({
  size,
  style,
  chainId,
  name,
}: {
  size: number;
  name: string | null;
  chainId: ChainId | null;
  style?: React.CSSProperties;
}) {
  const value = chainId
    ? String(typeof chainId === 'number' ? chainId : parseInt(chainId, 16))
    : null;

  return (
    <UIText
      aria-hidden={true}
      kind="body/regular"
      title={name || undefined}
      style={{
        userSelect: 'none',
        backgroundColor: 'var(--neutral-300)',
        borderRadius: 4,
        textAlign: 'center',
        lineHeight: `${size}px`,
        fontSize: size <= 24 ? 8 : size <= 36 ? 10 : 14,
        width: size,
        height: size,
        ...style,
      }}
    >
      {(!value || value.length > 4) && name
        ? name.charAt(0).toUpperCase()
        : value || '?'}
    </UIText>
  );
}
export function NetworkIcon({ src, chainId, name, size = 32, style }: Props) {
  return src ? (
    <div style={{ width: size, height: size }} title={name || undefined}>
      <Image
        src={src}
        alt=""
        style={{ width: '100%', display: 'block', ...style }}
        renderError={() => (
          <TextFallback name={name} chainId={chainId} size={size} />
        )}
      />
    </div>
  ) : (
    <TextFallback name={name} chainId={chainId} size={size} />
  );
}
