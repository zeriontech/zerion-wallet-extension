import React from 'react';
import { Surface } from 'src/ui/ui-kit/Surface';
import { UIText } from 'src/ui/ui-kit/UIText';
import { VStack } from 'src/ui/ui-kit/VStack';
import { useAddressParams } from 'src/ui/shared/user-address/useAddressParams';
import { CircleSpinner } from 'src/ui/ui-kit/CircleSpinner';
import { HStack } from 'src/ui/ui-kit/HStack';
import InviteIcon from 'jsx:src/ui/assets/invite.svg';
import { Button } from 'src/ui/ui-kit/Button';
import { useCopyToClipboard } from 'src/ui/shared/useCopyToClipboard';
import { usePreferences } from 'src/ui/features/preferences';
import { Background } from '../Background';
import { PageColumn } from '../PageColumn';
import { NavigationTitle } from '../NavigationTitle';
import { useInvitationInfo, type ClaimCode } from './useInvitationInfo';

function InvitationCode({ claimCode }: { claimCode: ClaimCode }) {
  const { status } = claimCode;
  const { handleCopy, isSuccess } = useCopyToClipboard({
    text: `https://claim.linkdrop.io/#/redeem/${claimCode.claim_code}`,
  });

  const disabled = status !== 'CREATED';
  const buttonTitle = isSuccess
    ? 'Copied!'
    : status === 'CREATED'
    ? 'Copy link'
    : status === 'CLAIMED'
    ? 'Claimed'
    : status === 'PENDING'
    ? 'Pending'
    : status === 'DEACTIVATED'
    ? 'Deactivated'
    : status === 'FAILED'
    ? 'Failed'
    : 'Expired';

  return (
    <HStack
      gap={24}
      justifyContent="space-between"
      alignItems="center"
      style={{ width: '100%', paddingInline: 8 }}
    >
      <HStack gap={16} alignItems="center" style={{ width: '100%' }}>
        <InviteIcon
          style={{ color: disabled ? 'var(--neutral-400)' : 'var(--primary)' }}
        />
        <UIText
          kind="body/accent"
          color={disabled ? 'var(--neutral-400)' : undefined}
        >
          Invite
        </UIText>
      </HStack>
      <Button
        size={32}
        style={{ width: 120, paddingInline: 4 }}
        onClick={handleCopy}
        disabled={disabled}
        kind={disabled ? 'neutral' : 'primary'}
      >
        {buttonTitle}
      </Button>
    </HStack>
  );
}

// For development and testing use only
function ReturnBannerButton() {
  const isProd = process.env.NODE_ENV === 'production';
  const { preferences, setPreferences } = usePreferences();

  if (isProd || !preferences?.hiddenInvitationFlow) {
    return null;
  }

  return (
    <Button onClick={() => setPreferences({ hiddenInvitationFlow: false })}>
      Return banner
    </Button>
  );
}

export function InvitationPage() {
  const { singleAddressNormalized } = useAddressParams();
  const { data, isLoading } = useInvitationInfo(singleAddressNormalized);

  return (
    <Background backgroundKind="neutral">
      <PageColumn
        style={{
          paddingTop: 18,
          ['--surface-background-color' as string]: 'var(--white)',
        }}
      >
        <NavigationTitle title="My Invites" />
        <Surface>
          <div
            style={{
              height: 160,
              width: '100%',
              background: 'linear-gradient(#3232DC, #6543C6, #E46C8F, #FF7583)',
              borderRadius: '12px 12px 0 0',
            }}
          >
            <img
              alt=""
              src={require('./page.png')}
              style={{ width: '100%', height: '100%' }}
            />
          </div>
          <VStack gap={16} style={{ padding: 16 }}>
            <UIText kind="headline/h1">
              Zerion Extension
              <br />
              Early Access
            </UIText>
            {isLoading ? (
              <CircleSpinner />
            ) : (
              <VStack gap={20}>
                {data?.claim_codes.map((code) => (
                  <InvitationCode key={code.claim_code} claimCode={code} />
                ))}
              </VStack>
            )}
          </VStack>
        </Surface>
        <ReturnBannerButton />
      </PageColumn>
    </Background>
  );
}
