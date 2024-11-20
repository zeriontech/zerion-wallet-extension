import React from 'react';
import DropIcon from 'jsx:src/ui/assets/drop.svg';
import { HStack } from 'src/ui/ui-kit/HStack';
import { GradientBorder } from 'src/ui/components/GradientBorder';
import { UIText } from 'src/ui/ui-kit/UIText';
import { Button } from 'src/ui/ui-kit/Button';
import { UnstyledLink } from 'src/ui/ui-kit/UnstyledLink';
import { emitter } from 'src/ui/shared/events';
import { useLocation } from 'react-router-dom';
import { useWalletsMetaByChunks } from 'src/ui/shared/requests/useWalletsMetaByChunks';
import { FEATURE_LOYALTY_FLOW } from 'src/env/config';

const bannerGradient = 'linear-gradient(90deg, #a024ef 0%, #fdbb6c 100%)';

export function XpDropBanner({ address }: { address: string }) {
  const { pathname } = useLocation();
  const { data: walletsMeta } = useWalletsMetaByChunks({
    addresses: [address],
    suspense: false,
  });

  const walletMeta = walletsMeta?.[0];
  const isVisible =
    FEATURE_LOYALTY_FLOW === 'on' && Boolean(walletMeta?.membership.retro);

  return isVisible ? (
    <div style={{ paddingInline: 16 }}>
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
                pathname,
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
    </div>
  ) : null;
}
