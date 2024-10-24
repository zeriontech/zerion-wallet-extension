import React from 'react';
import DropIcon from 'jsx:src/ui/assets/drop.svg';
import { HStack } from 'src/ui/ui-kit/HStack';
import { GradientBorder } from 'src/ui/components/GradientBorder';
import { UIText } from 'src/ui/ui-kit/UIText';
import { Button } from 'src/ui/ui-kit/Button';
import { Link } from 'react-router-dom';

export function ClaimXpBanner() {
  return (
    <GradientBorder
      borderColor="linear-gradient(90deg, #a024ef 0%, #fdbb6c 100%)"
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
          as={Link}
          to="/xp-drop"
          style={{
            minWidth: 109,
            background: 'linear-gradient(90deg, #a024ef 0%, #fdbb6c 100%)',
            color: 'var(--always-white)',
          }}
        >
          Claim
        </Button>
      </HStack>
    </GradientBorder>
  );
}
