import React from 'react';
import { Image } from 'src/ui/ui-kit/MediaFallback';
import { UIText } from '../UIText';

interface BaseProps {
  src?: string | null;
  symbol?: string;
  size?: number;
  style?: React.CSSProperties;
  title?: string;
}
type Props = BaseProps & ({ src: string } | { symbol: string });

export function TokenIcon({ src, symbol, size = 32, style, title }: Props) {
  const fallback = (
    <UIText
      kind="body/regular"
      style={{
        userSelect: 'none',
        backgroundColor: 'var(--neutral-300)',
        borderRadius: '50%',
        textAlign: 'center',
        lineHeight: `${size}px`,
        fontSize: size <= 24 ? 8 : size <= 36 ? 10 : 14,
        width: size,
        height: size,
        ...style,
      }}
    >
      {symbol?.slice(0, 3).toLowerCase() || '?'}
    </UIText>
  );
  return src ? (
    <Image
      src={src}
      alt=""
      title={title}
      style={{
        width: size,
        height: size,
        display: 'block',
        ...style,
      }}
      renderError={() => fallback}
    />
  ) : (
    fallback
  );
}
