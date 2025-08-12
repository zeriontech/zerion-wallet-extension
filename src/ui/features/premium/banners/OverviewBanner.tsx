import React from 'react';
import { useLocation } from 'react-router-dom';
import { UIText } from 'src/ui/ui-kit/UIText';
import { UnstyledButton } from 'src/ui/ui-kit/UnstyledButton';
import { VStack } from 'src/ui/ui-kit/VStack';
import CloseIcon from 'jsx:src/ui/assets/close.svg';
import StarIcon from 'jsx:src/ui/assets/star.svg';
import { UnstyledLink } from 'src/ui/ui-kit/UnstyledLink';
import { emitter } from 'src/ui/shared/events';

export function OverviewPremiumBanner({
  onDismiss,
}: {
  onDismiss: () => void;
}) {
  const { pathname } = useLocation();

  return (
    <div style={{ position: 'relative' }}>
      <UnstyledLink
        to="/premium"
        style={{ position: 'relative' }}
        onClick={() => {
          emitter.emit('bannerClicked', {
            bannerName: 'Buy Premium',
            pathname,
          });
        }}
      >
        <VStack
          gap={4}
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
            style={{ position: 'absolute', right: -88, top: -8, height: 160 }}
            alt="Premium banner decoration"
            src="https://cdn.zerion.io/images/dna-assets/premium_banner_decoration.png"
            srcSet="https://cdn.zerion.io/images/dna-assets/premium_banner_decoration.png, https://cdn.zerion.io/images/dna-assets/premium_banner_decoration_2x.png 2x"
          />
          <div style={{ display: 'flex' }}>
            <StarIcon
              style={{ width: 32, height: 32, color: 'var(--always-white)' }}
            />
          </div>
          <UIText kind="headline/h3" color="var(--always-white)">
            Get Premium
          </UIText>
          <UIText
            kind="small/regular"
            color="var(--always-white)"
            style={{ position: 'relative' }}
          >
            Lower fees, PnL and more
          </UIText>
        </VStack>
      </UnstyledLink>
      <UnstyledButton
        onClick={onDismiss}
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
