import React from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { FillView } from 'src/ui/components/FillView';
import { PageColumn } from 'src/ui/components/PageColumn';
import { PageTop } from 'src/ui/components/PageTop';
import { walletPort } from 'src/ui/shared/channels';
import { useAddressParams } from 'src/ui/shared/user-address/useAddressParams';
import { HStack } from 'src/ui/ui-kit/HStack';
import { Media } from 'src/ui/ui-kit/Media';
import type { Item } from 'src/ui/ui-kit/SurfaceList';
import { SurfaceList } from 'src/ui/ui-kit/SurfaceList';
import { UIText } from 'src/ui/ui-kit/UIText';
import { formatCurrencyToParts } from 'src/shared/units/formatCurrencyValue';
import { NBSP } from 'src/ui/shared/typography';
import { PageBottom } from 'src/ui/components/PageBottom';
import { PortfolioValue } from 'src/ui/shared/requests/PortfolioValue';
import { WalletDisplayName } from 'src/ui/components/WalletDisplayName';
import { IsConnectedToActiveTab } from 'src/ui/shared/requests/useIsConnectedToActiveTab';
import { setCurrentAddress } from 'src/ui/shared/requests/setCurrentAddress';
import { WalletAvatar } from 'src/ui/components/WalletAvatar';
import { NeutralDecimals } from 'src/ui/ui-kit/NeutralDecimals';
import { NavigationTitle } from 'src/ui/components/NavigationTitle';
import { UnstyledLink } from 'src/ui/ui-kit/UnstyledLink';
import AddWalletIcon from 'jsx:src/ui/assets/add-wallet.svg';
import { Button } from 'src/ui/ui-kit/Button';
import { TextLink } from 'src/ui/ui-kit/TextLink';
import { getGroupDisplayName } from 'src/ui/shared/getGroupDisplayName';
import {
  isPrivateKeyContainer,
  isReadonlyContainer,
} from 'src/shared/types/validators';

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
        <Button
          kind="ghost"
          size={40}
          as={UnstyledLink}
          to="/get-started"
          title="Add Wallet"
        >
          <AddWalletIcon style={{ width: 24, height: 24 }} />
        </Button>
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
  const items: Item[] = [];
  let isVisuallyGrouped = false;
  for (const group of walletGroups) {
    // assertSignerContainer(group.walletContainer);
    if (walletGroups.length > 1) {
      isVisuallyGrouped = true;
      const isPrivateKeyGroup = isPrivateKeyContainer(group.walletContainer);
      const isReadonlyGroup = isReadonlyContainer(group.walletContainer);
      // const isPrivateKeyGroup = group.walletContainer.seedType === SeedType.privateKey;
      const to =
        isPrivateKeyGroup || isReadonlyGroup
          ? `/wallets/accounts/${group.walletContainer.wallets[0].address}?groupId=${group.id}`
          : `/wallets/groups/${group.id}`;
      items.push({
        key: group.id,
        pad: false,
        component: (
          <UIText
            as={TextLink}
            to={to}
            kind="caption/accent"
            color="var(--neutral-700)"
            style={{
              paddingBottom: 4,
              paddingTop: 12,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {isPrivateKeyGroup
              ? 'Private Key'
              : getGroupDisplayName(group.name)}
          </UIText>
        ),
      });
    }
    for (const wallet of group.walletContainer.wallets) {
      items.push({
        key: `${group.id}-${wallet.address}`,
        onClick: () => {
          setCurrentAddressMutation.mutate(wallet.address);
        },
        component: (
          <HStack gap={4} justifyContent="space-between" alignItems="center">
            <Media
              image={
                <IsConnectedToActiveTab
                  address={wallet.address}
                  render={({ data: isConnected }) => (
                    <WalletAvatar
                      address={wallet.address}
                      size={40}
                      active={Boolean(isConnected)}
                      borderRadius={4}
                    />
                  )}
                />
              }
              text={
                <UIText kind="small/regular">
                  <WalletDisplayName wallet={wallet} />
                </UIText>
              }
              detailText={
                <PortfolioValue
                  address={wallet.address}
                  render={(entry) => (
                    <UIText kind="headline/h3">
                      {entry.value ? (
                        <NeutralDecimals
                          parts={formatCurrencyToParts(
                            entry.value?.total_value || 0,
                            'en',
                            'usd'
                          )}
                        />
                      ) : (
                        NBSP
                      )}
                    </UIText>
                  )}
                />
              }
            />
            {wallet.address.toLowerCase() === singleAddress.toLowerCase() ? (
              <span style={{ color: 'var(--primary)' }}>✔</span>
            ) : null}
          </HStack>
        ),
      });
    }
  }
  items.push({
    key: 0,
    to: '/wallets',
    separatorTop: true,
    component: <div style={{ color: 'var(--primary)' }}>Manage Wallets</div>,
  });
  return (
    <PageColumn>
      {title}
      <PageTop />
      <SurfaceList
        items={items}
        // I wish we had inline css pseudo-classes instead :(
        style={isVisuallyGrouped ? { paddingTop: 4 } : undefined}
      />
      <PageBottom />
    </PageColumn>
  );
}
