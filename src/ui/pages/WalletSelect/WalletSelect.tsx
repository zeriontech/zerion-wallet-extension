import React, { useMemo } from 'react';
import { useAddressPortfolio } from 'defi-sdk';
import { useMutation, useQuery } from 'react-query';
import { useNavigate } from 'react-router-dom';
import { AddressText } from 'src/ui/components/AddressText';
import { BlockieImg } from 'src/ui/components/BlockieImg';
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
import { Spacer } from 'src/ui/ui-kit/Spacer';

function PortfolioValue({
  address: addressStr,
  render,
}: {
  address: string;
  render: (value: ReturnType<typeof useAddressPortfolio>) => JSX.Element;
}) {
  const address = useMemo(() => addressStr.toLowerCase(), [addressStr]);
  const query = useAddressPortfolio({
    address,
    currency: 'usd',
    portfolio_fields: 'all',
    use_portfolio_service: true,
  });
  return render(query);
}

export function WalletSelect() {
  const navigate = useNavigate();
  const { data: walletGroups, isLoading } = useQuery(
    'wallet/getWalletGroups',
    () => walletPort.request('getWalletGroups'),
    { useErrorBoundary: true }
  );
  const { singleAddress, refetch } = useAddressParams();
  const setCurrentAddressMutation = useMutation(
    (address: string) => walletPort.request('setCurrentAddress', { address }),
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
          <UIText kind="h/5_reg" color="var(--neutral-500)">
            No Wallets
          </UIText>
        </FillView>
      ) : (
        <SurfaceList
          items={walletGroups
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
                    image={<BlockieImg address={wallet.address} size={24} />}
                    text={<AddressText as="span" address={wallet.address} />}
                    detailText={
                      <PortfolioValue
                        address={wallet.address}
                        render={(entry) => (
                          <UIText kind="label/reg">
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
                  {wallet.address.toLowerCase() === singleAddress ? (
                    <span style={{ color: 'var(--primary)' }}>✔</span>
                  ) : null}
                </HStack>
              ),
            }))
            .concat([
              {
                key: '1234',
                // @ts-ignore
                to: '/wallets',
                component: (
                  <div style={{ color: 'var(--primary)' }}>Manage Wallets</div>
                ),
              },
            ])}
        />
      )}
      <Spacer height={24} />
    </PageColumn>
  );
}
