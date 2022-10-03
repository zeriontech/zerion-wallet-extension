import React from 'react';
import { UIText } from '../UIText';

interface BaseProps {
  src?: string | null;
  symbol?: string;
  size?: number;
  style?: React.CSSProperties;
}
type Props = BaseProps & ({ src: string } | { symbol: string });

export function TokenIcon({ src, symbol, size = 32, style }: Props) {
  return src ? (
    <div style={{ width: size, height: size }}>
      <img
        src={src}
        alt=""
        style={{ width: '100%', display: 'block', ...style }}
      />
    </div>
  ) : (
    <UIText
      kind="body/s_reg"
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
}
