import React from 'react';
import DropIcon from 'jsx:src/ui/assets/drop.svg';
import { HStack } from 'src/ui/ui-kit/HStack';
import { GradientBorder } from 'src/ui/components/GradientBorder';
import { UIText } from 'src/ui/ui-kit/UIText';
import { Button } from 'src/ui/ui-kit/Button';
import { UnstyledLink } from 'src/ui/ui-kit/UnstyledLink';
import { emitter } from 'src/ui/shared/events';
import { useLocation } from 'react-router-dom';

const bannerGradient = 'linear-gradient(90deg, #a024ef 0%, #fdbb6c 100%)';

export function XpDropClaimBanner() {
  const { pathname } = useLocation();

  return (
    <GradientBorder
      borderColor={bannerGradient}
      borderWidth={2}
      borderRadius={16}
      backgroundColor="var(--white)"
    >
      <HStack gap={8} justifyContent="space-between" style={{ padding: 8 }}>
        <HStack gap={8} alignItems="center" justifyContent="center">
          <DropIcon style={{ marginLeft: 8 }} />
          <UIText kind="small/accent">Claim Your XP & Level</UIText>
        </HStack>
        <Button
          kind="ghost"
          size={36}
          as={UnstyledLink}
          to="/xp-drop/onboarding"
          onClick={() => {
            emitter.emit('buttonClicked', {
              buttonScope: 'Loaylty',
              buttonName: 'Claim XP',
              location: pathname,
            });
          }}
          style={{
            minWidth: 109,
            background: bannerGradient,
            color: 'var(--always-white)',
          }}
        >
          Claim
        </Button>
      </HStack>
    </GradientBorder>
  );
}
