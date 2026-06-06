import React from 'react';
import { UIText } from 'src/ui/ui-kit/UIText';
import { VStack } from 'src/ui/ui-kit/VStack';
import { HStack } from 'src/ui/ui-kit/HStack';
import { Button } from 'src/ui/ui-kit/Button';
import { Dialog2 } from 'src/ui/ui-kit/ModalDialogs/Dialog2/Dialog2';
import bulletLightning from 'url:./assets/bullet-lightning.png';
import bulletProtected from 'url:../SwapOnboardingDialog/assets/bullet-protected.png';

interface Bullet {
  icon: string;
  title: string;
  body: React.ReactNode;
}

const BULLETS: Bullet[] = [
  {
    icon: bulletLightning,
    title: 'Faster experience',
    body: 'Swaps now happen in one tap. Smoother, quicker, less friction.',
  },
  {
    icon: bulletProtected,
    title: 'Always protected',
    body: 'Every transaction is automatically scanned for risks before it runs.',
  },
];

export function SwapButtonOnboardingDialog({
  open,
  onClose,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <Dialog2
      open={open}
      onClose={onClose}
      size="content"
      autoFocusInput={false}
      style={{
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        borderBottomLeftRadius: 0,
        borderBottomRightRadius: 0,
        overflow: 'hidden',
      }}
    >
      <VStack
        gap={8}
        style={{ paddingInline: 16, paddingTop: 16, paddingBottom: 25 }}
      >
        <VStack gap={32} style={{ paddingBlock: 24 }}>
          <UIText kind="headline/h1" style={{ paddingInline: 24 }}>
            Set. Tap. Swap.
          </UIText>
          <VStack gap={16} style={{ paddingInline: 16 }}>
            {BULLETS.map((bullet) => (
              <HStack
                key={bullet.title}
                gap={8}
                alignItems="center"
                style={{ width: '100%' }}
              >
                <img
                  src={bullet.icon}
                  alt=""
                  width={48}
                  height={48}
                  style={{ flexShrink: 0, objectFit: 'contain' }}
                />
                <VStack gap={0} style={{ flex: 1, minWidth: 0 }}>
                  <UIText kind="body/accent">{bullet.title}</UIText>
                  <UIText kind="body/regular" color="var(--neutral-500)">
                    {bullet.body}
                  </UIText>
                </VStack>
              </HStack>
            ))}
          </VStack>
        </VStack>
        <HStack
          gap={8}
          style={{
            paddingTop: 16,
            width: '100%',
            gridTemplateColumns: '1fr 1fr',
          }}
        >
          <Button
            kind="neutral"
            onClick={onClose}
            style={{ height: 52, borderRadius: 16, paddingInline: 24 }}
          >
            Cancel
          </Button>
          <Button
            kind="primary"
            onClick={onConfirm}
            style={{ height: 52, borderRadius: 16, paddingInline: 24 }}
          >
            Continue Swap
          </Button>
        </HStack>
      </VStack>
    </Dialog2>
  );
}
