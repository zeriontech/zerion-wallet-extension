import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Surface } from 'src/ui/ui-kit/Surface';
import { UIText } from 'src/ui/ui-kit/UIText';
import { VStack } from 'src/ui/ui-kit/VStack';
import { useAddressParams } from 'src/ui/shared/user-address/useAddressParams';
import { CircleSpinner } from 'src/ui/ui-kit/CircleSpinner';
import { HStack } from 'src/ui/ui-kit/HStack';
import InviteIcon from 'jsx:src/ui/assets/invite.svg';
import { Button } from 'src/ui/ui-kit/Button';
import { useCopyToClipboard } from 'src/ui/shared/useCopyToClipboard';
import { useProfileName } from 'src/ui/shared/useProfileName';
import { UnstyledAnchor } from 'src/ui/ui-kit/UnstyledAnchor';
import { openInNewWindow } from 'src/ui/shared/openInNewWindow';
import LinkIcon from 'jsx:src/ui/assets/new-window.svg';
import * as helperStyles from 'src/ui/style/helpers.module.css';
import { Background } from '../Background';
import { PageColumn } from '../PageColumn';
import { NavigationTitle } from '../NavigationTitle';
import {
  useInvitationInfo,
  type ClaimCode,
  getClaimLinkStatus,
} from './useInvitationInfo';

function InvitationCode({ claimCode }: { claimCode: ClaimCode }) {
  const { status, claim_code, link_id } = claimCode;
  const { handleCopy, isSuccess } = useCopyToClipboard({
    text: `https://claim.linkdrop.io/#/redeem/${claim_code}`,
  });
  const { data } = useQuery({
    queryKey: ['getClaimLinkStatus', link_id],
    queryFn: async () => {
      return getClaimLinkStatus(link_id);
    },
    suspense: false,
    enabled: status === 'CLAIMED',
  });

  const name = useProfileName({
    address: data?.data.recipient || '',
    name: null,
  });

  const disabled = status !== 'CREATED';
  const showLink = data?.data.recipient && Boolean(name);
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
    : status === 'EXPIRED'
    ? 'Expired'
    : 'Failed';

  return (
    <HStack
      gap={16}
      justifyContent="space-between"
      alignItems="center"
      style={{ width: '100%', paddingInline: 8 }}
    >
      <HStack gap={16} alignItems="center" style={{ width: '100%' }}>
        <InviteIcon
          style={{ color: disabled ? 'var(--neutral-400)' : 'var(--primary)' }}
        />
        {showLink ? (
          <UnstyledAnchor
            className={helperStyles.hoverUnderline}
            href={`https://app.zerion.io/${data.data.recipient}`}
            onClick={openInNewWindow}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: 'var(--primary)' }}
          >
            <HStack
              gap={4}
              alignItems="center"
              style={{ gridTemplateColumns: '1fr auto' }}
            >
              <UIText
                kind="body/accent"
                style={{
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {name}
              </UIText>
              <LinkIcon style={{ width: 16, height: 16 }} />
            </HStack>
          </UnstyledAnchor>
        ) : (
          <UIText
            kind="body/accent"
            color={disabled ? 'var(--neutral-400)' : undefined}
          >
            Invite
          </UIText>
        )}
      </HStack>
      <Button
        size={32}
        style={{
          width: 120,
          paddingInline: 4,
          cursor: disabled ? 'auto' : undefined,
        }}
        onClick={handleCopy}
        disabled={disabled}
        kind={disabled ? 'regular' : 'primary'}
      >
        <UIText
          kind="caption/accent"
          color={disabled ? 'var(--neutral-400)' : undefined}
        >
          {buttonTitle}
        </UIText>
      </Button>
    </HStack>
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
      </PageColumn>
    </Background>
  );
}
