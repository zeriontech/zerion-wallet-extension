import React from 'react';
import { VStack } from 'src/ui/ui-kit/VStack';
import { UIText } from 'src/ui/ui-kit/UIText';
import GiftOutlineIcon from 'jsx:src/ui/assets/gift-outline.svg';
import CloseIcon from 'jsx:src/ui/assets/close.svg';
import { UnstyledButton } from 'src/ui/ui-kit/UnstyledButton';
import { UnstyledLink } from 'src/ui/ui-kit/UnstyledLink';
import { Spacer } from 'src/ui/ui-kit/Spacer';
import CardsSrc from './cards.png';
import Cards2xSrc from './cards@2x.png';
import * as styles from './styles.module.css';

export function InviteFriendsBanner({ onDismiss }: { onDismiss?(): void }) {
  return (
    <div className={styles.bannerContainer}>
      <img
        className={styles.image}
        style={{ width: 160, height: 108 }}
        src={CardsSrc}
        srcSet={`${CardsSrc}, ${Cards2xSrc} 2x`}
        alt=""
      />
      <UnstyledLink className={styles.bannerLink} to="/invite">
        <div className={styles.bannerContent}>
          <GiftOutlineIcon />
          <Spacer height={4} />
          <VStack gap={4}>
            <UIText kind="headline/h3" color="var(--always-black)">
              Invite Friends
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
