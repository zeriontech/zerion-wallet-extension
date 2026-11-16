import React from 'react';
import InvisibleIcon from 'jsx:src/ui/assets/invisible.svg';
import { Button } from 'src/ui/ui-kit/Button';
import { HStack } from 'src/ui/ui-kit/HStack';
import { Surface } from 'src/ui/ui-kit/Surface';
import { UIText } from 'src/ui/ui-kit/UIText';
import { VStack } from 'src/ui/ui-kit/VStack';

export function HideTokenHint({
  onHide,
  onDismiss,
}: {
  onHide: () => void;
  onDismiss: () => void;
}) {
  return (
    <Surface style={{ padding: 12, backgroundColor: 'var(--neutral-100)' }}>
      <VStack gap={8}>
        <HStack gap={8} alignItems="center">
          <InvisibleIcon
            style={{
              width: 20,
              height: 20,
              flexShrink: 0,
              color: 'var(--neutral-500)',
            }}
          />
          <UIText kind="body/accent">Looks like spam?</UIText>
        </HStack>
        <UIText kind="small/regular" color="var(--neutral-500)">
          This token looks like spam. Hiding removes it from your portfolio, and you can unhide it
          anytime in Settings → Hidden Assets.
        </UIText>
        <HStack gap={8}>
          <Button kind="primary" size={36} onClick={onHide}>
            Hide Token
          </Button>
          <Button kind="neutral" size={36} onClick={onDismiss}>
            Not Now
          </Button>
        </HStack>
      </VStack>
    </Surface>
  );
}
