import React, { useCallback } from 'react';
import { HStack } from 'src/ui/ui-kit/HStack';
import { UIText } from 'src/ui/ui-kit/UIText';
import { UnstyledButton } from 'src/ui/ui-kit/UnstyledButton';
import { UnstyledLink } from 'src/ui/ui-kit/UnstyledLink';
import { VStack } from 'src/ui/ui-kit/VStack';
import CloseIcon from 'jsx:src/ui/assets/close.svg';
import ZerionIcon from 'jsx:src/ui/assets/zerion-logo-transparent.svg';
import { usePreferences } from '../../preferences';
import { useSingleAddressPremiumStatus } from '../getPremiumStatus';

export function PremiumFormBanner({
  address,
  style,
}: {
  address: string;
  style: React.CSSProperties;
}) {
  const { preferences, setPreferences } = usePreferences();

  const handleDismiss = useCallback(() => {
    setPreferences({
      formPremiumBannerDismissed: true,
    });
  }, [setPreferences]);

  const { isPremium } = useSingleAddressPremiumStatus({ address });

  const shouldShowBanner =
    preferences && !preferences.formPremiumBannerDismissed && !isPremium;

  if (!shouldShowBanner) {
    return null;
  }

  return (
    <div style={{ position: 'relative', ...style }}>
      <UnstyledLink to="/premium" style={{ position: 'relative' }}>
        <HStack
          gap={12}
          alignItems="center"
          style={{
            position: 'relative',
            padding: '12px 16px',
            width: '100%',
            borderRadius: 20,
            background: 'linear-gradient(90deg, #6C6CF9 0%, #FF7583 100%)',
            overflow: 'hidden',
          }}
        >
          <img
            style={{ position: 'absolute', right: -80, top: -44, height: 160 }}
            alt="Premium banner decoration"
            src="https://cdn.zerion.io/images/dna-assets/premium_banner_decoration.png"
            srcSet="https://cdn.zerion.io/images/dna-assets/premium_banner_decoration.png, https://cdn.zerion.io/images/dna-assets/premium_banner_decoration_2x.png 2x"
          />
          <ZerionIcon
            style={{
              width: 36,
              height: 36,
              position: 'relative',
              color: 'var(--always-white)',
            }}
          />
          <VStack gap={0} style={{ position: 'relative' }}>
            <UIText kind="body/accent" color="var(--always-white)">
              Save 50% on fees
            </UIText>
            <UIText kind="caption/regular" color="var(--always-white)">
              Get Zerion Premium
            </UIText>
          </VStack>
        </HStack>
      </UnstyledLink>
      <UnstyledButton
        onClick={handleDismiss}
        aria-label="close"
        style={{
          color: 'var(--always-white)',
          position: 'absolute',
          top: 12,
          right: 12,
          width: 16,
          height: 16,
        }}
      >
        <CloseIcon style={{ width: 16, height: 16 }} />
      </UnstyledButton>
    </div>
  );
}
