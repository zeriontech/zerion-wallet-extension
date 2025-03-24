import React from 'react';
import { VStack } from 'src/ui/ui-kit/VStack';
import { UIText } from 'src/ui/ui-kit/UIText';
import GiftSolidIcon from 'jsx:src/ui/assets/gift-solid.svg';
import CloseIcon from 'jsx:src/ui/assets/close.svg';
import { UnstyledButton } from 'src/ui/ui-kit/UnstyledButton';
import { UnstyledLink } from 'src/ui/ui-kit/UnstyledLink';
import { Spacer } from 'src/ui/ui-kit/Spacer';
import * as styles from './styles.module.css';

export function InviteFriendsBanner({ onDismiss }: { onDismiss?(): void }) {
  return (
    <div className={styles.bannerContainer}>
      <img
        className={styles.image}
        style={{ width: 160, height: 108 }}
        src="https://cdn.zerion.io/images/dna-assets/invite-banner-decoration.png"
        srcSet="https://cdn.zerion.io/images/dna-assets/invite-banner-decoration.png, https://cdn.zerion.io/images/dna-assets/invite-banner-decoration_2x.png 2x"
        alt=""
      />
      <UnstyledLink className={styles.bannerLink} to="/invite">
        <div className={styles.bannerContent}>
          <GiftSolidIcon color="var(--always-black)" />
          <Spacer height={4} />
          <VStack gap={4}>
            <UIText kind="headline/h3" color="var(--always-black)">
              Invite Friends 123
            </UIText>
            <UIText kind="small/regular" color="var(--always-black)">
              Earn XP & Gift Free Premium
            </UIText>
          </VStack>
        </div>
      </UnstyledLink>
      {onDismiss ? (
        <UnstyledButton
          onClick={onDismiss}
          aria-label="close"
          className={styles.closeButton}
        >
          <CloseIcon style={{ width: 16, height: 16 }} />
        </UnstyledButton>
      ) : null}
    </div>
  );
}
