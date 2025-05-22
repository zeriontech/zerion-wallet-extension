import React from 'react';
import { registerPreview } from 'src/ui-lab/previews/registerPreview';
import { HStack } from 'src/ui/ui-kit/HStack';
import { Image } from 'src/ui/ui-kit/MediaFallback';
import { UIText } from 'src/ui/ui-kit/UIText';
import { VStack } from 'src/ui/ui-kit/VStack';

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
  src,
}: {
  size: number;
  name: string | null;
  style?: React.CSSProperties;
  src: string | null | undefined;
}) {
  return (
    <UIText
      aria-hidden={true}
      kind="body/regular"
      title={name || undefined}
      data-image-src={String(src)} // helper for debugging
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
          <TextFallback name={name} size={size} style={style} src={src} />
        )}
      />
    </div>
  ) : (
    <TextFallback name={name} size={size} style={style} src={src} />
  );
}

registerPreview({
  name: 'NetworkIcon',
  component: (
    <VStack gap={8}>
      <HStack gap={8} alignItems="center">
        <NetworkIcon name="Arbitrum" />
        <UIText kind="body/regular">Arbitrum</UIText>
      </HStack>
      <HStack gap={8} alignItems="center">
        <NetworkIcon
          name="Base"
          src="https://chain-icons.s3.amazonaws.com/chainlist/8453"
        />
        <UIText kind="body/regular">Base</UIText>
      </HStack>
    </VStack>
  ),
});
