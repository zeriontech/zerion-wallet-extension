import React from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { FillView } from 'src/ui/components/FillView';
import { PageColumn } from 'src/ui/components/PageColumn';
import { walletPort } from 'src/ui/shared/channels';
import { useAddressParams } from 'src/ui/shared/user-address/useAddressParams';
import { HStack } from 'src/ui/ui-kit/HStack';
import { UIText } from 'src/ui/ui-kit/UIText';
import { PageBottom } from 'src/ui/components/PageBottom';
import { setCurrentAddress } from 'src/ui/shared/requests/setCurrentAddress';
import { NavigationTitle } from 'src/ui/components/NavigationTitle';
import { UnstyledLink } from 'src/ui/ui-kit/UnstyledLink';
import AddIcon from 'jsx:src/ui/assets/plus.svg';
import EditIcon from 'jsx:src/ui/assets/edit.svg';
import { Button } from 'src/ui/ui-kit/Button';
import { VStack } from 'src/ui/ui-kit/VStack';
import { Background } from 'src/ui/components/Background';
import { Spacer } from 'src/ui/ui-kit/Spacer';
import { WalletList } from './WalletList';

export function WalletSelect() {
  const navigate = useNavigate();
  const { data: walletGroups, isLoading } = useQuery({
    queryKey: ['wallet/uiGetWalletGroups'],
    queryFn: () => walletPort.request('uiGetWalletGroups'),
    useErrorBoundary: true,
  });
  const { singleAddress, refetch } = useAddressParams();
  const setCurrentAddressMutation = useMutation({
    mutationFn: (address: string) => setCurrentAddress({ address }),
    onSuccess() {
      refetch();
      navigate(-1);
    },
  });
  if (isLoading) {
    return null;
  }
  const title = (
    <NavigationTitle
      title="Wallets"
      elementEnd={
        <HStack
          gap={0}
          alignItems="center"
          style={{ position: 'relative', left: -36 }}
        >
          <Button
            kind="ghost"
            size={36}
            style={{ padding: 6 }}
            as={UnstyledLink}
            to="/wallets"
            title="Edit Wallets"
          >
            <EditIcon style={{ width: 24, height: 24 }} />
          </Button>
          <Button
            kind="ghost"
            size={36}
            style={{ padding: 6 }}
            as={UnstyledLink}
            to="/get-started"
            title="Add Wallet"
          >
            <AddIcon style={{ width: 24, height: 24 }} />
          </Button>
        </HStack>
      }
    />
  );
  if (!walletGroups?.length) {
    return (
      <PageColumn>
        {title}
        <FillView>
          <UIText kind="headline/h2" color="var(--neutral-500)">
            No Wallets
          </UIText>
        </FillView>
      </PageColumn>
    );
  }

  return (
    <Background backgroundKind="white">
      <PageColumn>
        {title}
        <Spacer height={10} />
        <VStack gap={2}>
          <WalletList
            walletGroups={walletGroups}
            onSelect={(wallet) => {
              setCurrentAddressMutation.mutate(wallet.address);
            }}
            selectedAddress={singleAddress}
          />
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <Button
              kind="neutral"
              size={36}
              style={{
                paddingInline: 12,
                backgroundColor: 'var(--neutral-100)',
              }}
              as={UnstyledLink}
              to="/get-started"
              title="Add Wallet"
            >
              Add Wallet
            </Button>
          </div>
        </VStack>
        <PageBottom />
      </PageColumn>
    </Background>
  );
}
