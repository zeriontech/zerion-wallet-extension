import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useCurrency } from 'src/modules/currency/useCurrency';
import { invariant } from 'src/shared/invariant';
import { NavigationTitle } from 'src/ui/components/NavigationTitle';
import { PageColumn } from 'src/ui/components/PageColumn';
import { StickyBottomPanel } from 'src/ui/ui-kit/BottomPanel';
import { Button } from 'src/ui/ui-kit/Button';
import { HStack } from 'src/ui/ui-kit/HStack';
import { VStack } from 'src/ui/ui-kit/VStack';
import SwapIcon from 'jsx:src/ui/assets/actions/swap.svg';
import SendIcon from 'jsx:src/ui/assets/actions/send.svg';
import BridgeIcon from 'jsx:src/ui/assets/actions/bridge.svg';
import FlagIcon from 'jsx:src/ui/assets/flag.svg';
import { UIText } from 'src/ui/ui-kit/UIText';
import { PageTop } from 'src/ui/components/PageTop';
import { useAssetFullInfo } from 'src/modules/zerion-api/hooks/useAssetFullInfo';
import type { Asset } from 'src/modules/zerion-api/requests/asset-get-fungible-full-info';
import { UnstyledAnchor } from 'src/ui/ui-kit/UnstyledAnchor';
import { useQuery } from '@tanstack/react-query';
import { walletPort } from 'src/ui/shared/channels';
import { useAddressParams } from 'src/ui/shared/user-address/useAddressParams';
import { isReadonlyAccount } from 'src/shared/types/validators';
import { useWalletAssetDetails } from 'src/modules/zerion-api/hooks/useWalletAssetDetails';
import { useBackgroundKind } from 'src/ui/components/Background';
import { UnstyledLink } from 'src/ui/ui-kit/UnstyledLink';
import { useWalletPortfolio } from 'src/modules/zerion-api/hooks/useWalletPortfolio';
import { useHttpClientSource } from 'src/modules/zerion-api/hooks/useHttpClientSource';
import { NetworkId } from 'src/modules/networks/NetworkId';
import { CircleSpinner } from 'src/ui/ui-kit/CircleSpinner';
import * as styles from './styles.module.css';
import { AssetHistory } from './AssetHistory';
import { AssetAddressStats } from './AssetAddressDetails';
import { AssetGlobalStats } from './AssetGlobalStats';
import { AssetTitleAndChart } from './AssetTitleAndChart';
import { AssetResources } from './AssetResources';
import { AssetHeader } from './AssetHeader';

const SCROLL_THRESHOLD = 80;

function AssetPageHeader({ asset }: { asset: Asset }) {
  const [showTokenInfoInHeader, setShowTokenInfoInHeader] = useState(false);

  useEffect(() => {
    const handleScroll = () =>
      setShowTokenInfoInHeader(window.scrollY < SCROLL_THRESHOLD);

    handleScroll();
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return showTokenInfoInHeader ? null : (
    <AssetHeader asset={asset} className={styles.assetHeaderContent} />
  );
}

function ReportAssetLink({ asset }: { asset: Asset }) {
  return (
    <UnstyledAnchor
      target="_blank"
      href={`https://zerion-io.typeform.com/to/IVsRHfBy?typeform-medium=embed-snippet#symbol=${asset.symbol}&asset_id=${asset.id}`}
      rel="noopener noreferrer"
      className="parent-hover"
      style={{
        ['--parent-content-color' as string]: 'var(--neutral-400)',
        ['--parent-hovered-content-color' as string]: 'var(--neutral-700)',
      }}
    >
      <HStack
        gap={8}
        alignItems="center"
        className="content-hover"
        justifyContent="center"
      >
        <FlagIcon style={{ width: 20, height: 20 }} />
        <UIText kind="small/accent">Report Asset</UIText>
      </HStack>
    </UnstyledAnchor>
  );
}

export function AssetPage() {
  const { asset_code } = useParams();
  useBackgroundKind({ kind: 'white' });
  invariant(asset_code, 'Asset Code is required');

  const { currency } = useCurrency();
  const { data: assetFullInfoData } = useAssetFullInfo({
    currency,
    fungibleId: asset_code,
  });
  const assetFullInfo = assetFullInfoData?.data;
  const { ready, singleAddress, singleAddressNormalized } = useAddressParams();
  const { data: portfolioData } = useWalletPortfolio(
    {
      addresses: [singleAddressNormalized],
      currency,
      nftPriceType: 'not_included',
    },
    { source: useHttpClientSource() },
    { enabled: ready }
  );
  const { data: walletData } = useWalletAssetDetails(
    {
      assetId: asset_code,
      currency,
      groupBy: ['by-app'],
      addresses: [singleAddressNormalized],
    },
    { enabled: ready }
  );

  const { data: wallet } = useQuery({
    queryKey: ['wallet/uiGetWalletByAddress', singleAddress, null],
    queryFn: () =>
      walletPort.request('uiGetWalletByAddress', {
        address: singleAddress,
        groupId: null,
      }),
    suspense: false,
    enabled: ready,
  });

  const chainWithTheBiggestBalance = useMemo(() => {
    const chainData = walletData?.data?.chainsDistribution;
    if (!chainData) {
      return NetworkId.Zero;
    }
    return chainData.reduce(
      (acc, chain) =>
        chain.value > acc.value
          ? { value: chain.value, chain: chain.chain.id }
          : acc,
      { value: chainData[0].value ?? 0, chain: chainData[0].chain.id }
    ).chain;
  }, [walletData]);

  const bestChainForPurchase = useMemo(() => {
    const avaliableChains = Object.keys(
      assetFullInfo?.fungible.implementations || {}
    );
    const chainPortfolioDistribution =
      portfolioData?.data?.positionsChainsDistribution;
    if (!chainPortfolioDistribution || !avaliableChains.length) {
      return NetworkId.Zero;
    }
    return avaliableChains.reduce(
      (acc, chain) =>
        chainPortfolioDistribution[chain] > chainPortfolioDistribution[acc]
          ? chain
          : acc,
      avaliableChains[0]
    );
  }, [portfolioData, assetFullInfo]);

  if (!assetFullInfo?.fungible || !wallet || !walletData) {
    return (
      <>
        <NavigationTitle title={null} documentTitle={`${asset_code} - info`} />
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <CircleSpinner />
        </div>
      </>
    );
  }

  const isWatchedAddress = isReadonlyAccount(wallet);
  const isEmptyBalance = walletData?.data.totalValue === 0;

  const chainForSwap = isEmptyBalance
    ? bestChainForPurchase
    : chainWithTheBiggestBalance;

  return (
    <PageColumn>
      <NavigationTitle
        title={<AssetPageHeader asset={assetFullInfo.fungible} />}
        documentTitle={`${assetFullInfo.fungible.name} - info`}
      />
      <PageTop />
      <VStack
        gap={24}
        style={{ flexGrow: 1, alignContent: 'start', paddingBottom: 72 }}
      >
        <AssetTitleAndChart asset={assetFullInfo.fungible} />
        <AssetGlobalStats assetFullInfo={assetFullInfo} />
        <AssetAddressStats
          address={singleAddressNormalized}
          wallet={wallet}
          assetFullInfo={assetFullInfo}
          walletAssetDetails={walletData.data}
        />
        <AssetResources assetFullInfo={assetFullInfo} />
        <AssetHistory
          assetId={asset_code}
          assetFullInfo={assetFullInfo}
          address={singleAddressNormalized}
        />
        <ReportAssetLink asset={assetFullInfo.fungible} />
      </VStack>
      {isWatchedAddress ? null : (
        <StickyBottomPanel
          style={{ padding: 0, background: 'none', boxShadow: 'none' }}
          backdropStyle={{ inset: '-16px -16px 0' }}
        >
          <HStack
            gap={8}
            style={{
              width: '100%',
              gridTemplateColumns: isEmptyBalance ? '1fr' : '1fr auto auto',
            }}
          >
            <Button
              kind="primary"
              size={48}
              as={UnstyledLink}
              to={
                isEmptyBalance
                  ? `/swap-form?chainInput=${chainForSwap}&receiveTokenInput=${asset_code}`
                  : `/swap-form?chainInput=${chainForSwap}&spendTokenInput=${asset_code}`
              }
            >
              <HStack gap={8} alignItems="center" justifyContent="center">
                <SwapIcon style={{ width: 20, height: 20 }} />
                <UIText kind="body/accent">Swap</UIText>
              </HStack>
            </Button>
            {isEmptyBalance ? null : (
              <>
                <Button
                  as={UnstyledLink}
                  kind="primary"
                  size={48}
                  to={`/send-form?tokenAssetCode=${asset_code}&tokenChain=${chainWithTheBiggestBalance}`}
                  style={{ padding: 14 }}
                  aria-label="Send Token"
                >
                  <SendIcon style={{ width: 20, height: 20 }} />
                </Button>
                <Button
                  kind="primary"
                  size={48}
                  style={{ padding: 14 }}
                  aria-label="Bridge Token"
                >
                  <BridgeIcon style={{ width: 20, height: 20 }} />
                </Button>
              </>
            )}
          </HStack>
        </StickyBottomPanel>
      )}
    </PageColumn>
  );
}
