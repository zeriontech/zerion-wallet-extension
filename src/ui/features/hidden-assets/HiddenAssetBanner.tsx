import React from 'react';
import EyeIcon from 'jsx:src/ui/assets/eye.svg';
import { Button } from 'src/ui/ui-kit/Button';
import { HStack } from 'src/ui/ui-kit/HStack';
import { Surface } from 'src/ui/ui-kit/Surface';
import { UIText } from 'src/ui/ui-kit/UIText';

export function HiddenAssetBanner({ onUnhide }: { onUnhide: () => void }) {
  return (
    <Surface
      style={{
        padding: '8px 8px 8px 12px',
        backgroundColor: 'var(--neutral-100)',
      }}
    >
      <HStack gap={8} alignItems="center">
        <EyeIcon
          style={{
            width: 20,
            height: 20,
            flexShrink: 0,
            color: 'var(--neutral-500)',
          }}
        />
        <UIText kind="small/regular" style={{ flexGrow: 1 }}>
          You hid this token
        </UIText>
        <Button kind="neutral" size={32} onClick={onUnhide} style={{ flexShrink: 0 }}>
          Unhide
        </Button>
      </HStack>
    </Surface>
  );
}
