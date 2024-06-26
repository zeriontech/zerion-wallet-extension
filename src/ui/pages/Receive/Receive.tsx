import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { Background } from 'src/ui/components/Background';
import { NavigationTitle } from 'src/ui/components/NavigationTitle';
import { PageColumn } from 'src/ui/components/PageColumn';
import { UIText } from 'src/ui/ui-kit/UIText';
import { VStack } from 'src/ui/ui-kit/VStack';
import { invariant } from 'src/shared/invariant';
import { useQuery } from '@tanstack/react-query';
import { lookupAddressName } from 'src/modules/name-service';
import { WalletAvatar } from 'src/ui/components/WalletAvatar';
import { lookupAddressNameKey } from 'src/ui/shared/useProfileName';
import { persistentQuery } from 'src/ui/shared/requests/queryClientPersistence';
import { AddressDetails } from './AddressDetails';

export function Receive() {
  const [params] = useSearchParams();
  const address = params.get('address');
  invariant(address, 'address param is required');

  const { data: domain } = useQuery({
    queryKey: persistentQuery([lookupAddressNameKey, address]),
    queryFn: () => lookupAddressName(address),
    suspense: false,
  });

  return (
    <Background backgroundKind="white">
      <PageColumn style={{ paddingTop: 40 }}>
        <NavigationTitle
          title="Receive"
          elementEnd={
            <WalletAvatar
              active={false}
              address={address}
              size={32}
              borderRadius={4}
            />
          }
        />
        <VStack gap={16} style={{ justifyItems: 'center' }}>
          <div
            style={{
              backgroundColor: 'var(--neutral-100)',
              borderRadius: 12,
              padding: '8px 26px',
              color: 'var(--neutral-600)',
              textAlign: 'center',
            }}
          >
            <UIText kind="small/regular">
              Assets can only be sent within
              <br />
              the same network
            </UIText>
          </div>
          <AddressDetails address={address} domain={domain} />
        </VStack>
      </PageColumn>
    </Background>
  );
}
