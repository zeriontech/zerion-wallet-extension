import React, { useEffect, useMemo } from 'react';
import { NavigationType, useNavigationType, useParams } from 'react-router-dom';
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
import { whiteBackgroundKind } from 'src/ui/components/Background/Background';
import { useWalletAssetPnl } from 'src/modules/zerion-api/hooks/useWalletAssetPnl';
import { useBodyStyle } from 'src/ui/components/Background/Background';
import { AssetHistory } from './AssetHistory';
import { AssetAddressStats } from './AssetAddressDetails';
import { AssetGlobalStats } from './AssetGlobalStats';
import { AssetTitleAndChart } from './AssetTitleAndChart';
import { AssetResources } from './AssetResources';
import { AssetHeader } from './AssetHeader';
import { AssetDescription } from './AssetDescription';

const SHOW_BRIDGE_BUTTON = false; // TODO: make true after bridge is implemented

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

export function AssetInfo() {
  const { asset_code } = useParams();
  const navigationType = useNavigationType();
  useEffect(() => {
    if (navigationType === NavigationType.Push) {
      window.scrollTo(0, 0);
    }
  }, [navigationType]);
  useBackgroundKind({ kind: 'white' });
  useBodyStyle(
    useMemo(
      () => ({
        ['--url-bar-padding-bottom' as string]: '16px',
        ['--url-bar-background' as string]: 'transparent',
        ['--url-bar-backdrop-filter' as string]: 'blur(5px)',
      }),
      []
    )
  );
  invariant(asset_code, 'Asset Code is required');
  const navigationType = useNavigationType();
  useEffect(() => {
    if (navigationType === NavigationType.Push) {
      window.scrollTo(0, 0);
    }
  }, [navigationType]);
  useBackgroundKind(whiteBackgroundKind);

  const { currency } = useCurrency();
  const { data: assetFullInfoData, isLoading } = useAssetFullInfo(
    { currency, fungibleId: asset_code },
    { source: useHttpClientSource() }
  );
  const assetFullInfo = assetFullInfoData?.data;
  const { ready, params } = useAddressParams();
  const { data: portfolioData } = useWalletPortfolio(
    {
      addresses: [params.address],
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
      addresses: [params.address],
    },
    { source: useHttpClientSource() },
    { enabled: ready }
  );

  const assetAddressPnlQuery = useWalletAssetPnl(
    {
      addresses: [params.address],
      fungibleId: asset_code,
      currency,
    },
    { source: useHttpClientSource() },
    { enabled: ready }
  );

  const { data: wallet } = useQuery({
    queryKey: ['wallet/uiGetCurrentWallet'],
    queryFn: () => {
      return walletPort.request('uiGetCurrentWallet');
    },
  });

  const chainWithTheBiggestBalance =
    walletData?.data?.chainsDistribution?.at(0)?.chain.id || NetworkId.Zero;

  if (isLoading || !wallet || !walletData) {
    return (
      <>
        <NavigationTitle title={null} documentTitle={`${asset_code} - info`} />
        <PageColumn style={{ alignItems: 'center', justifyContent: 'center' }}>
          <CircleSpinner />
        </PageColumn>
      </>
    );
  }

  invariant(assetFullInfo?.fungible, 'Fungible asset info is missing');

  const isWatchedAddress = isReadonlyAccount(wallet);
  const isEmptyBalance = walletData?.data.totalValue === 0;

  const chainForSwap = isEmptyBalance
    ? assetFullInfo.extra.mainChain
    : chainWithTheBiggestBalance;

  return (
    <PageColumn>
      <NavigationTitle
        title={<AssetHeader asset={assetFullInfo.fungible} />}
        documentTitle={`${assetFullInfo.fungible.name} - info`}
      />
      <VStack
        gap={24}
        style={{ flexGrow: 1, alignContent: 'start', paddingBottom: 72 }}
      >
        <AssetTitleAndChart asset={assetFullInfo.fungible} />
        <AssetGlobalStats assetFullInfo={assetFullInfo} />
        <AssetAddressStats
          address={params.address}
          wallet={wallet}
          assetFullInfo={assetFullInfo}
          walletAssetDetails={walletData.data}
          assetAddressPnlQuery={assetAddressPnlQuery}
        />
        <AssetResources assetFullInfo={assetFullInfo} />
        <AssetDescription assetFullInfo={assetFullInfo} />
        <AssetHistory
          assetId={asset_code}
          assetFullInfo={assetFullInfo}
          address={params.address}
        />
        <ReportAssetLink asset={assetFullInfo.fungible} />
      </VStack>
      {isWatchedAddress || !portfolioData ? null : (
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
                {/* TODO: Implement UnstyledLink after bridge form is implemented */}
                {SHOW_BRIDGE_BUTTON ? (
                  <Button
                    kind="primary"
                    size={48}
                    style={{ padding: 14 }}
                    aria-label="Bridge Token"
                  >
                    <BridgeIcon style={{ width: 20, height: 20 }} />
                  </Button>
                ) : null}
              </>
            )}
          </HStack>
        </StickyBottomPanel>
      )}
    </PageColumn>
  );
}
