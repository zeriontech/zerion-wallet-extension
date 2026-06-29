import React from 'react';
import type { DistributionItem } from 'src/ui/components/DistributionChart';
import { Image2 } from 'src/ui/ui-kit/MediaFallback/MediaFallback2';
import { HStack } from 'src/ui/ui-kit/HStack';
import { UIText } from 'src/ui/ui-kit/UIText';

const ICON_SIZE = 24;

/** Dialog header for a distribution tile: its icon (or glyph) + label. */
export function DistributionItemTitle({ item }: { item: DistributionItem }) {
  return (
    <HStack gap={8} alignItems="center">
      {item.iconNode ? (
        item.iconNode
      ) : (
        <Image2
          src={item.iconUrl ?? undefined}
          alt={item.label}
          style={{
            width: ICON_SIZE,
            height: ICON_SIZE,
            borderRadius: 6,
            display: 'block',
            objectFit: 'cover',
          }}
          renderError={() => (
            <div
              style={{
                width: ICON_SIZE,
                height: ICON_SIZE,
                borderRadius: 6,
                backgroundColor: 'var(--neutral-300)',
              }}
            />
          )}
        />
      )}
      <UIText kind="body/accent">{item.label}</UIText>
    </HStack>
  );
}
