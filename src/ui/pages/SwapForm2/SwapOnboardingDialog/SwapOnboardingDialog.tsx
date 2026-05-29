import React from 'react';
import { UIText } from 'src/ui/ui-kit/UIText';
import { VStack } from 'src/ui/ui-kit/VStack';
import { HStack } from 'src/ui/ui-kit/HStack';
import { Button } from 'src/ui/ui-kit/Button';
import { Dialog2 } from 'src/ui/ui-kit/ModalDialogs/Dialog2/Dialog2';
import bulletCrossNetwork from 'url:./assets/bullet-cross-network.png';
import bulletSmartRouting from 'url:./assets/bullet-smart-routing.png';
import bulletProtected from 'url:./assets/bullet-protected.png';
import { OnboardingAnimation } from './OnboardingAnimation';

interface Bullet {
  icon: string;
  title: string;
  body: React.ReactNode;
}

const BULLETS: Bullet[] = [
  {
    icon: bulletCrossNetwork,
    title: 'Cross-network trading',
    body: (
      <>
        Swap across 50+ networks.
        <br />
        No bridging required.
      </>
    ),
  },
  {
    icon: bulletSmartRouting,
    title: 'Smart routing',
    body: 'Zerion finds the most efficient path for your trade across top DEX aggregators.',
  },
  {
    icon: bulletProtected,
    title: 'Always protected',
    body: 'Every transaction is automatically scanned for risks before it runs.',
  },
];

export function SwapOnboardingDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
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
        maxHeight: '100vh',
      }}
    >
      <VStack gap={24}>
        <OnboardingAnimation />
        <VStack gap={24} style={{ paddingInline: 16 }}>
          <VStack gap={12}>
            <UIText kind="headline/h1" style={{ paddingLeft: 32 }}>
              One swap, every chain.
            </UIText>
            <VStack gap={12} style={{ paddingInline: 16 }}>
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
                    <UIText kind="small/accent">{bullet.title}</UIText>
                    <UIText kind="small/regular" color="var(--neutral-500)">
                      {bullet.body}
                    </UIText>
                  </VStack>
                </HStack>
              ))}
            </VStack>
          </VStack>
          <div style={{ paddingTop: 0, paddingBottom: 20 }}>
            <Button
              kind="primary"
              onClick={onClose}
              style={{
                width: '100%',
                height: 52,
                borderRadius: 16,
                paddingInline: 24,
              }}
            >
              Continue
            </Button>
          </div>
        </VStack>
      </VStack>
    </Dialog2>
  );
}
