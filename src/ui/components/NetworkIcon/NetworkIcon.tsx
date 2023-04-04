import React from 'react';
import { Image } from 'src/ui/ui-kit/MediaFallback';
import { UIText } from 'src/ui/ui-kit/UIText';

interface BaseProps {
  src?: string | null;
  chainId: string | number | null;
  size?: number;
  style?: React.CSSProperties;
  name: string | null;
}
type Props = BaseProps & ({ src: string } | { chainId: string | number });

function TextFallback({
  size,
  style,
  chainId,
  name,
}: {
  size: number;
  name: string | null;
  chainId: string | number | null;
  style?: React.CSSProperties;
}) {
  const value = chainId
    ? String(typeof chainId === 'number' ? chainId : parseInt(chainId, 16))
    : null;

  return (
    <UIText
      aria-hidden={true}
      kind="body/regular"
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
    <div style={{ width: size, height: size }}>
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
