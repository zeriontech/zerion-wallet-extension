import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { Background } from 'src/ui/components/Background';
import { NavigationTitle } from 'src/ui/components/NavigationTitle';
import { PageColumn } from 'src/ui/components/PageColumn';
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
            <div style={{ justifySelf: 'center' }}>
              <WalletAvatar
                active={false}
                address={address}
                size={32}
                borderRadius={6}
              />
            </div>
          }
        />
        <AddressDetails address={address} domain={domain} />
      </PageColumn>
    </Background>
  );
}
