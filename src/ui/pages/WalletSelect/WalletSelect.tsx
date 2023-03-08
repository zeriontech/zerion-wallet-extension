import React from 'react';
import { useMutation, useQuery } from 'react-query';
import { useNavigate } from 'react-router-dom';
import { FillView } from 'src/ui/components/FillView';
import { PageColumn } from 'src/ui/components/PageColumn';
import { PageTop } from 'src/ui/components/PageTop';
import { walletPort } from 'src/ui/shared/channels';
import { useAddressParams } from 'src/ui/shared/user-address/useAddressParams';
import { HStack } from 'src/ui/ui-kit/HStack';
import { Media } from 'src/ui/ui-kit/Media';
import { SurfaceList } from 'src/ui/ui-kit/SurfaceList';
import { UIText } from 'src/ui/ui-kit/UIText';
import { formatCurrencyValue } from 'src/shared/units/formatCurrencyValue';
import { NBSP } from 'src/ui/shared/typography';
import { PageBottom } from 'src/ui/components/PageBottom';
import { PortfolioValue } from 'src/ui/shared/requests/PortfolioValue';
import { WalletDisplayName } from 'src/ui/components/WalletDisplayName';
import { IsConnectedToActiveTab } from 'src/ui/shared/requests/useIsConnectedToActiveTab';
import { setCurrentAddress } from 'src/ui/shared/requests/setCurrentAddress';
import { WalletAvatar } from 'src/ui/components/WalletAvatar';

export function WalletSelect() {
  const navigate = useNavigate();
  const { data: walletGroups, isLoading } = useQuery(
    'wallet/uiGetWalletGroups',
    () => walletPort.request('uiGetWalletGroups'),
    { useErrorBoundary: true }
  );
  const { singleAddress, refetch } = useAddressParams();
  const setCurrentAddressMutation = useMutation(
    (address: string) => setCurrentAddress({ address }),
    {
      onSuccess() {
        refetch();
        navigate(-1);
      },
    }
  );
  if (isLoading) {
    return null;
  }
  return (
    <PageColumn>
      <PageTop />
      {!walletGroups?.length ? (
        <FillView>
          <UIText kind="headline/h2" color="var(--neutral-500)">
            No Wallets
          </UIText>
        </FillView>
      ) : (
        <SurfaceList
          items={[
            ...walletGroups
              .flatMap((group) => group.walletContainer.wallets)
              .map((wallet) => ({
                key: wallet.address,
                onClick: () => {
                  setCurrentAddressMutation.mutate(wallet.address);
                },
                component: (
                  <HStack
                    gap={4}
                    justifyContent="space-between"
                    alignItems="center"
                  >
                    <Media
                      image={
                        <IsConnectedToActiveTab
                          address={wallet.address}
                          render={({ data: isConnected }) => (
                            <WalletAvatar
                              address={wallet.address}
                              size={24}
                              active={Boolean(isConnected)}
                              borderRadius={4}
                            />
                          )}
                        />
                      }
                      text={<WalletDisplayName wallet={wallet} />}
                      detailText={
                        <PortfolioValue
                          address={wallet.address}
                          render={(entry) => (
                            <UIText kind="caption/regular">
                              {entry.value
                                ? formatCurrencyValue(
                                    entry.value?.total_value || 0,
                                    'en',
                                    'usd'
                                  )
                                : NBSP}
                            </UIText>
                          )}
                        />
                      }
                    />
                    {wallet.address.toLowerCase() ===
                    singleAddress.toLowerCase() ? (
                      <span style={{ color: 'var(--primary)' }}>✔</span>
                    ) : null}
                  </HStack>
                ),
              })),
            {
              key: 0,
              to: '/wallets',
              separatorTop: true,
              component: (
                <div style={{ color: 'var(--primary)' }}>Manage Wallets</div>
              ),
            },
            {
              key: 1,
              to: '/get-started',
              component: (
                <div style={{ color: 'var(--primary)' }}>+ Add Wallet</div>
              ),
            },
          ]}
        />
      )}
      <PageBottom />
    </PageColumn>
  );
}
