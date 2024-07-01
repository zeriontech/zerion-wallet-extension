import React from 'react';
import { Image } from 'src/ui/ui-kit/MediaFallback';
import { UIText } from 'src/ui/ui-kit/UIText';

interface Props {
  src?: string | null;
  size?: number;
  style?: React.CSSProperties;
  name: string | null;
}

function TextFallback({
  size,
  style,
  name,
}: {
  size: number;
  name: string | null;
  style?: React.CSSProperties;
}) {
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
      {name ? name.slice(0, 3).toUpperCase() : '???'}
    </UIText>
  );
}

export function NetworkIcon({ src, name, size = 32, style }: Props) {
  return src ? (
    <div style={{ width: size, height: size }} title={name || undefined}>
      <Image
        src={src}
        alt=""
        style={{ width: '100%', display: 'block', ...style }}
        renderError={() => (
          <TextFallback name={name} size={size} style={style} />
        )}
      />
    </div>
  ) : (
    <TextFallback name={name} size={size} style={style} />
  );
}
