import React from 'react';
import { SurfaceList } from 'src/ui/ui-kit/SurfaceList';
import { HStack } from 'src/ui/ui-kit/HStack';
import { UIText } from 'src/ui/ui-kit/UIText';
import InviteIcon from 'jsx:src/ui/assets/invite.svg';
import { useAddressParams } from 'src/ui/shared/user-address/useAddressParams';
import { AngleRightRow } from '../AngleRightRow';
import { useInvitationInfo } from './useInvitationInfo';

export function InvitationMenuButton() {
  const { singleAddressNormalized } = useAddressParams();
  const { data } = useInvitationInfo(singleAddressNormalized);

  if (!data?.claim_codes?.length) {
    return null;
  }

  return (
    <SurfaceList
      items={[
        {
          key: 0,
          to: '/invitations',
          component: (
            <AngleRightRow>
              <HStack
                gap={24}
                justifyContent="space-between"
                alignItems="center"
                style={{ width: '100%' }}
              >
                <HStack gap={8} alignItems="center">
                  <InviteIcon style={{ color: 'var(--primary)' }} />
                  <UIText kind="body/regular">My Invites</UIText>
                </HStack>
                <UIText kind="small/regular" color="var(--neutral-500)">
                  {data.claim_codes.length}
                </UIText>
              </HStack>
            </AngleRightRow>
          ),
        },
      ]}
    />
  );
}
