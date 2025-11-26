import React, { useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
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
import SettingsIcon from 'jsx:src/ui/assets/settings.svg';
import { Button } from 'src/ui/ui-kit/Button';
import { VStack } from 'src/ui/ui-kit/VStack';
import { useBackgroundKind } from 'src/ui/components/Background';
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
import RewardsIcon from 'jsx:src/ui/assets/rewards.svg';
import { normalizeAddress } from 'src/shared/normalizeAddress';
import { getWalletParams } from 'src/ui/shared/requests/useWalletParams';
import { UnstyledAnchor } from 'src/ui/ui-kit/UnstyledAnchor';
import { useWalletsMetaByChunks } from 'src/ui/shared/requests/useWalletsMetaByChunks';
import { emitter } from 'src/ui/shared/events';
import { useStaleTime } from 'src/ui/shared/useStaleTime';
import { ViewLoading } from 'src/ui/components/ViewLoading';
import { isMatchForEcosystem } from 'src/shared/wallet/shared';
import type { BlockchainType } from 'src/shared/wallet/classifiers';
import { BlurrableBalance } from 'src/ui/components/BlurrableBalance';
import { usePreferences } from 'src/ui/features/preferences';
import { whiteBackgroundKind } from 'src/ui/components/Background/Background';
import type { WalletListGroup } from 'src/shared/wallet/wallet-list';
import {
  DEFAULT_WALLET_LIST_GROUPS,
  getWalletId,
} from 'src/shared/wallet/wallet-list';
import * as styles from './styles.module.css';
import { WalletList } from './WalletList';
import { WalletListEdit } from './WalletListEdit';
import { getFullWalletList } from './shared';

function PortfolioRow({
  walletGroups,
  walletsOrder,
}: {
  walletGroups: WalletGroup[];
  walletsOrder?: WalletListGroup[];
}) {
  const { currency } = useCurrency();

  const groups = useMemo(
    () =>
      getFullWalletList({
        walletsOrder,
        walletGroups,
      }),
    [walletsOrder, walletGroups]
  );

  const portfolioWalletIdSet = useMemo(() => {
    return new Set(groups?.[0]?.walletIds || []);
  }, [groups]);

  const addresses = useMemo(() => {
    return walletGroups
      .flatMap((group) =>
        group.walletContainer.wallets.map((wallet) => ({
          address: wallet.address,
          groupId: group.id,
        }))
      )
      .filter(({ address, groupId }) =>
        portfolioWalletIdSet.has(getWalletId({ address, groupId }))
      )
      .map(({ address }) => address);
  }, [walletGroups, portfolioWalletIdSet]);

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
            <UIText kind="headline/h3" style={{ display: 'flex' }}>
              {isLoading || !walletPortfolio ? (
                ellipsis
              ) : (
                <BlurrableBalance kind="headline/h3" color="var(--black)">
                  <NeutralDecimals
                    parts={formatCurrencyToParts(
                      walletPortfolio.totalValue || 0,
                      'en',
                      currency
                    )}
                  />
                </BlurrableBalance>
              )}
            </UIText>
          }
        />
      </HStack>
    </div>
  );
}

const ZERION_ORIGIN = 'https://app.zerion.io';

export function WalletSelect() {
  useBackgroundKind(whiteBackgroundKind);
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [params] = useSearchParams();

  const ecosystem = params.get('ecosystem') as BlockchainType;
  const { preferences, setPreferences } = usePreferences();
  const [editMode, setEditMode] = useState(false);

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
      ) || [],
    [ownedGroups]
  );

  const { data: walletsMeta, isLoading: isLoadingWalletsMeta } =
    useWalletsMetaByChunks({
      addresses: ownedAddresses,
      useErrorBoundary: false,
      suspense: false,
    });

  const ownedAddressesCount = ownedAddresses.length;

  const { singleAddress, refetch } = useAddressParams();
  const setCurrentAddressMutation = useMutation({
    mutationFn: (address: string) => setCurrentAddress({ address }),
    onSuccess() {
      refetch();
      navigate(-1);
    },
  });

  const { mutate: acceptZerionOrigin } = useMutation({
    mutationFn: async ({ address }: { address: string }) => {
      return walletPort.request('acceptOrigin', {
        origin: ZERION_ORIGIN,
        address,
      });
    },
  });

  const isLoadingForTooLong = useStaleTime(isLoadingWalletsMeta, 4000).isStale;
  const waitForWalletsMeta = isLoadingWalletsMeta && !isLoadingForTooLong;
  const isLoading = isLoadingWalletGroups || waitForWalletsMeta;

  if (isLoading) {
    return <ViewLoading kind="network" />;
  }

  const title = (
    <NavigationTitle
      title="Wallets"
      elementEnd={
        <HStack
          gap={editMode ? 8 : 0}
          alignItems="center"
          style={{ position: 'relative', left: editMode ? -52 : -36 }}
        >
          {editMode ? (
            <Button
              kind="ghost"
              size={36}
              style={{ padding: 6 }}
              as={UnstyledLink}
              to="/wallets"
              title="Manage Wallets"
            >
              <SettingsIcon style={{ width: 24, height: 24 }} />
            </Button>
          ) : (
            <Button
              kind="ghost"
              size={36}
              style={{ padding: 6 }}
              title="Edit Wallets"
              onClick={() => {
                setEditMode(true);
              }}
            >
              <EditIcon style={{ width: 24, height: 24 }} />
            </Button>
          )}
          {editMode ? (
            <Button
              kind="ghost"
              size={36}
              style={{ padding: 6 }}
              onClick={() => {
                setEditMode(false);
              }}
            >
              Done
            </Button>
          ) : (
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
          )}
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
    <PageColumn>
      {title}
      <Spacer height={10} />
      {ownedAddressesCount > 1 && !editMode ? (
        <PortfolioRow
          walletGroups={walletGroups}
          walletsOrder={preferences?.walletsOrder}
        />
      ) : null}
      <VStack
        gap={2}
        style={{
          ['--surface-background-color' as string]: 'transparent',
        }}
      >
        {editMode ? (
          <WalletListEdit
            walletsOrder={
              preferences?.walletsOrder || DEFAULT_WALLET_LIST_GROUPS
            }
            walletGroups={walletGroups}
            onChange={(newOrder) => {
              setPreferences({
                walletsOrder: newOrder,
              });
            }}
          />
        ) : (
          <WalletList
            walletsOrder={preferences?.walletsOrder}
            walletGroups={walletGroups}
            onSelect={(wallet) => {
              setCurrentAddressMutation.mutate(wallet.address);
            }}
            selectedAddress={singleAddress}
            showAddressValues={true}
            predicate={(wallet) =>
              !ecosystem || isMatchForEcosystem(wallet.address, ecosystem)
            }
            renderItemFooter={({ wallet }) => {
              const walletMeta = walletsMeta?.find(
                (meta) =>
                  normalizeAddress(meta.address) ===
                  normalizeAddress(wallet.address)
              );
              const addWalletParams = getWalletParams(wallet);
              const exploreRewardsUrl = walletMeta?.membership.newRewards
                ? `${ZERION_ORIGIN}/rewards?section=rewards&${addWalletParams}`
                : null;

              return exploreRewardsUrl ? (
                <Button
                  kind="neutral"
                  as={UnstyledAnchor}
                  href={exploreRewardsUrl}
                  onClick={() => {
                    emitter.emit('buttonClicked', {
                      buttonScope: 'Loaylty',
                      buttonName: 'Rewards',
                      pathname,
                    });
                    acceptZerionOrigin({ address: wallet.address });
                  }}
                  size={36}
                  style={{
                    borderRadius: '0 0 18px 18px',
                  }}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <HStack gap={8} alignItems="center" justifyContent="center">
                    <RewardsIcon
                      style={{
                        width: 20,
                        height: 20,
                        color:
                          'linear-gradient(90deg, #a024ef 0%, #fdbb6c 100%)',
                      }}
                    />
                    <UIText kind="small/accent" color="var(--primary-500)">
                      Explore Rewards
                    </UIText>
                  </HStack>
                </Button>
              ) : null;
            }}
          />
        )}
        {editMode ? null : (
          <div
            style={{ display: 'flex', justifyContent: 'center', paddingTop: 8 }}
          >
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
        )}
      </VStack>
      <PageBottom />
    </PageColumn>
  );
}
