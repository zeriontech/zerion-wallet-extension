import React, { useEffect, useMemo, useRef } from 'react';
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
import ShareIcon from 'jsx:src/ui/assets/share.svg';
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
import { whiteBackgroundKind } from 'src/ui/components/Background/Background';
import { useWalletAssetPnl } from 'src/modules/zerion-api/hooks/useWalletAssetPnl';
import { useCopyToClipboard } from 'src/ui/shared/useCopyToClipboard';
import { UnstyledButton } from 'src/ui/ui-kit/UnstyledButton';
import type { PopoverToastHandle } from 'src/ui/pages/Settings/PopoverToast';
import { PopoverToast } from 'src/ui/pages/Settings/PopoverToast';
import { usePremiumStatus } from 'src/ui/features/premium/getPremiumStatus';
import { AssetHistory } from './AssetHistory';
import { AssetAddressStats } from './AssetAddressDetails';
import { AssetGlobalStats } from './AssetGlobalStats';
import { AssetTitleAndChart } from './AssetTitleAndChart';
import { AssetResources } from './AssetResources';
import {
  AssetDefaultHeader,
  AssetHeader as AssetScrolledHeader,
} from './AssetHeader';
import { AssetDescription } from './AssetDescription';
import * as styles from './styles.module.css';

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

function ShareAssetLink({ asset }: { asset: Asset }) {
  const toastRef = useRef<PopoverToastHandle>(null);
  const { handleCopy } = useCopyToClipboard({
    text: `https://app.zerion.io/tokens/${asset.symbol}-${asset.id}`,
    onSuccess: () => toastRef.current?.showToast(),
  });

  return (
    <>
      <PopoverToast
        ref={toastRef}
        style={{
          bottom: 'calc(100px + var(--technical-panel-bottom-height, 0px))',
        }}
      >
        Link Copied to Clipboard
      </PopoverToast>
      <UnstyledButton
        onClick={handleCopy}
        title="Copy Link"
        aria-label="Copy Link"
      >
        <ShareIcon />
      </UnstyledButton>
    </>
  );
}

export function AssetInfo() {
  const { asset_code } = useParams();
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

  const { isPremium, walletsMetaQuery } = usePremiumStatus({
    address: params.address,
  });

  const assetAddressPnlQuery = useWalletAssetPnl(
    {
      addresses: [params.address],
      fungibleId: asset_code,
      currency,
    },
    { source: useHttpClientSource() },
    { enabled: ready && isPremium }
  );

  const { data: wallet } = useQuery({
    queryKey: ['wallet/uiGetCurrentWallet'],
    queryFn: () => {
      return walletPort.request('uiGetCurrentWallet');
    },
  });

  const chainWithTheBiggestBalance =
    walletData?.data?.chainsDistribution?.at(0)?.chain.id || NetworkId.Zero;

  const premiumStatus = useMemo(() => {
    return {
      isPremium,
      isLoading: walletsMetaQuery.isLoading,
    };
  }, [isPremium, walletsMetaQuery.isLoading]);

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

  if (!assetFullInfo?.fungible) {
    return (
      <PageColumn>
        <NavigationTitle title="Unknown Token" documentTitle="Unknown Token" />
        <PageTop />
        <VStack
          gap={16}
          style={{
            flexGrow: 1,
            alignItems: 'center',
            justifyContent: 'center',
            paddingBottom: 72,
          }}
        >
          <UIText kind="body/regular" style={{ textAlign: 'center' }}>
            We don't track this token's info
          </UIText>
        </VStack>
      </PageColumn>
    );
  }

  const isWatchedAddress = isReadonlyAccount(wallet);
  const isEmptyBalance = walletData?.data.totalValue === 0;

  const chainForSwap = isEmptyBalance
    ? assetFullInfo.extra.mainChain
    : chainWithTheBiggestBalance;

  return (
    <PageColumn>
      <NavigationTitle
        title={
          <div className={styles.headerContainer}>
            <AssetDefaultHeader
              asset={assetFullInfo.fungible}
              className={styles.defaultHeader}
            />
            <AssetScrolledHeader
              asset={assetFullInfo.fungible}
              className={styles.header}
            />
          </div>
        }
        documentTitle={`${assetFullInfo.fungible.name} - info`}
        elementEnd={<ShareAssetLink asset={assetFullInfo.fungible} />}
      />
      <PageTop />
      <VStack
        gap={24}
        style={{ flexGrow: 1, alignContent: 'start', paddingBottom: 72 }}
      >
        <AssetTitleAndChart
          asset={assetFullInfo.fungible}
          address={params.address}
        />
        <AssetGlobalStats assetFullInfo={assetFullInfo} />
        <AssetAddressStats
          address={params.address}
          wallet={wallet}
          assetFullInfo={assetFullInfo}
          walletAssetDetails={walletData.data}
          assetAddressPnlQuery={assetAddressPnlQuery}
          premiumStatus={premiumStatus}
        />
        <AssetResources assetFullInfo={assetFullInfo} />
        <AssetDescription assetFullInfo={assetFullInfo} />
        <AssetHistory fungibleId={asset_code} address={params.address} />
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
                  ? `/swap-form?inputChain=${chainForSwap}&outputFungibleId=${asset_code}`
                  : `/swap-form?inputChain=${chainForSwap}&inputFungibleId=${asset_code}`
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
                  as={UnstyledLink}
                  to={`/bridge-form?inputFungibleId=${asset_code}&inputChain=${chainWithTheBiggestBalance}`}
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
