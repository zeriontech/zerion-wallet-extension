import React from 'react';
import { Spacer } from 'src/ui/ui-kit/Spacer';
import { VStack } from 'src/ui/ui-kit/VStack';
import { UIText } from 'src/ui/ui-kit/UIText';
import { Button } from 'src/ui/ui-kit/Button';
import { UnstyledLink } from 'src/ui/ui-kit/UnstyledLink';
import { usePreferences } from 'src/ui/features/preferences';
import { UnstyledButton } from 'src/ui/ui-kit/UnstyledButton';
import CloseIcon from 'jsx:src/ui/assets/close.svg';
import { useInvitationInfo } from './useInvitationInfo';
import * as styles from './styles.module.css';

export function InvitationBanner({ address }: { address: string }) {
  const { data } = useInvitationInfo(address, { useErrorBoundary: false });
  const { preferences, setPreferences } = usePreferences();

  if (
    preferences?.invitationBannerDismissed ||
    !data?.claim_codes?.some((code) => code.status === 'CREATED')
  ) {
    return null;
  }

  return (
    <>
      <VStack
        gap={12}
        style={{
          padding: '16px 16px 24px 16px',
          backgroundImage: `url(${require('./banner.png')})`,
          backgroundSize: '100% 100%',
          position: 'relative',
        }}
      >
        <UnstyledButton
          className={styles.closeButton}
          style={{
            position: 'absolute',
            right: 8,
            top: 8,
            width: 24,
            height: 24,
            padding: 4,
          }}
          onClick={() => {
            setPreferences({ invitationBannerDismissed: true });
          }}
        >
          <CloseIcon style={{ width: 16, height: 16 }} />
        </UnstyledButton>
        <UIText kind="headline/h3" color="var(--always-white)">
          Extension Early Access
        </UIText>
        <div>
          <Button
            kind="neutral"
            size={32}
            as={UnstyledLink}
            to="/invitations"
            style={{ backgroundColor: 'var(--always-white)', width: 120 }}
          >
            <UIText kind="caption/accent" color="var(--always-primary)">
              Invite frens
            </UIText>
          </Button>
        </div>
      </VStack>
      <Spacer height={12} />
    </>
  );
}
