import React from 'react';
import { Image } from 'src/ui/ui-kit/MediaFallback';
import { UIText } from 'src/ui/ui-kit/UIText';

interface BaseProps {
  src?: string | null;
  chainId?: string | number;
  size?: number;
  style?: React.CSSProperties;
}
type Props = BaseProps & ({ src: string } | { chainId: string });

function TextFallback({
  size,
  style,
  chainId,
}: {
  size: number;
  chainId?: string | number;
  style?: React.CSSProperties;
}) {
  return (
    <UIText
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
      {chainId
        ? String(typeof chainId === 'number' ? chainId : parseInt(chainId, 16))
        : '?'}
    </UIText>
  );
}
export function NetworkIcon({ src, chainId, size = 32, style }: Props) {
  return src ? (
    <div style={{ width: size, height: size }}>
      <Image
        src={src}
        alt=""
        style={{ width: '100%', display: 'block', ...style }}
        renderError={() => <TextFallback chainId={chainId} size={size} />}
      />
    </div>
  ) : (
    <TextFallback chainId={chainId} size={size} />
  );
}
