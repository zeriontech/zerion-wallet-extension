import React, { useMemo } from 'react';
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
import type { WalletGroup } from 'src/shared/types/WalletGroup';
import { isReadonlyContainer } from 'src/shared/types/validators';
import { useCurrency } from 'src/modules/currency/useCurrency';
import { NeutralDecimals } from 'src/ui/ui-kit/NeutralDecimals';
import { formatCurrencyToParts } from 'src/shared/units/formatCurrencyValue';
import PortfolioIcon from 'jsx:src/ui/assets/portfolio.svg';
import { Media } from 'src/ui/ui-kit/Media';
import { ellipsis } from 'src/ui/shared/typography';
import { useWalletPortfolio } from 'src/modules/zerion-api/hooks/useWalletPortfolio';
import { useHttpClientSource } from 'src/modules/zerion-api/hooks/useHttpClientSource';
import { getWalletsMetaByChunks } from 'src/modules/zerion-api/requests/wallet-get-meta';
import { WalletList } from './WalletList';
import * as styles from './styles.module.css';

function PortfolioRow({ walletGroups }: { walletGroups: WalletGroup[] }) {
  const { currency } = useCurrency();

  const addresses = useMemo(() => {
    return walletGroups
      .filter((group) => !isReadonlyContainer(group.walletContainer))
      .flatMap((group) =>
        group.walletContainer.wallets.map((wallet) => wallet.address)
      );
  }, [walletGroups]);

  const { data, isLoading } = useWalletPortfolio(
    { addresses, currency },
    { source: useHttpClientSource() }
  );
  const walletPortfolio = data?.data;

  return (
    <div className={styles.portfolio}>
      <HStack gap={4} justifyContent="space-between" alignItems="center">
        <Media
          vGap={0}
          image={<PortfolioIcon className={styles.portfolioIcon} />}
          text={<UIText kind="small/regular">Portfolio</UIText>}
          detailText={
            <UIText kind="headline/h3">
              {isLoading || !walletPortfolio ? (
                ellipsis
              ) : (
                <NeutralDecimals
                  parts={formatCurrencyToParts(
                    walletPortfolio.totalValue || 0,
                    'en',
                    currency
                  )}
                />
              )}
            </UIText>
          }
        />
      </HStack>
    </div>
  );
}

export function WalletSelect() {
  const navigate = useNavigate();
  const { data: walletGroups, isLoading: isLoadingWalletGroups } = useQuery({
    queryKey: ['wallet/uiGetWalletGroups'],
    queryFn: () => walletPort.request('uiGetWalletGroups'),
    useErrorBoundary: true,
  });
  const ownedGroups = useMemo(
    () =>
      walletGroups?.filter(
        (group) => !isReadonlyContainer(group.walletContainer)
      ),
    [walletGroups]
  );
  const ownedAddresses = useMemo(
    () =>
      ownedGroups?.flatMap((group) =>
        group.walletContainer.wallets.map((wallet) => wallet.address)
      ),
    [ownedGroups]
  );

  const { data: walletsMeta, isLoading: isLoadingWalletsMeta } = useQuery({
    queryKey: ['ZerionAPI.getWalletsMeta', ownedAddresses],
    queryFn: () =>
      ownedAddresses ? getWalletsMetaByChunks(ownedAddresses) : null,
    enabled: Boolean(ownedAddresses),
  });

  const ownedAddressesCount = useMemo(
    () =>
      (ownedGroups || []).reduce(
        (sum, group) => sum + group.walletContainer.wallets.length,
        0
      ),
    [ownedGroups]
  );

  const { singleAddress, refetch } = useAddressParams();
  const setCurrentAddressMutation = useMutation({
    mutationFn: (address: string) => setCurrentAddress({ address }),
    onSuccess() {
      refetch();
      navigate(-1);
    },
  });

  const isLoading = isLoadingWalletGroups || isLoadingWalletsMeta;

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
        {ownedAddressesCount > 1 ? (
          <PortfolioRow walletGroups={walletGroups} />
        ) : null}
        <VStack
          gap={2}
          style={{
            ['--surface-background-color' as string]: 'transparent',
          }}
        >
          <WalletList
            walletGroups={walletGroups}
            walletsMeta={walletsMeta || []}
            onSelect={(wallet) => {
              setCurrentAddressMutation.mutate(wallet.address);
            }}
            selectedAddress={singleAddress}
            showAddressValues={true}
            showExploreRewards={true}
          />
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <Button
              kind="neutral"
              size={36}
              style={{ paddingInline: 12 }}
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
