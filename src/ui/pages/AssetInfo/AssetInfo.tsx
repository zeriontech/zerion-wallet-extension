import React, { useEffect, useState } from 'react';
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
  invariant(asset_code, 'Asset Code is required');

  const { currency } = useCurrency();
  const { data } = useAssetFullInfo({ currency, fungibleId: asset_code });
  const { ready, singleAddress, singleAddressNormalized } = useAddressParams();
  const { data: walletData } = useWalletAssetDetails(
    {
      assetId: asset_code,
      currency,
      groupBy: ['by-app'],
      addresses: [singleAddressNormalized],
      addPnl: true,
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

  if (!data?.data.fungible || !wallet || !walletData) {
    return null;
  }

  const asset = data.data.fungible;
  const isWatchedAddress = isReadonlyAccount(wallet);
  const isEmptyBalance = walletData?.data.totalValue === 0;

  return (
    <PageColumn>
      <NavigationTitle
        title={<AssetPageHeader asset={asset} />}
        documentTitle={`${asset.name} - info`}
      />
      <PageTop />
      <VStack
        gap={24}
        style={{ flexGrow: 1, alignContent: 'start', paddingBottom: 72 }}
      >
        <AssetTitleAndChart asset={asset} />
        <AssetGlobalStats assetFullInfo={data.data} />
        <AssetAddressStats
          address={singleAddressNormalized}
          wallet={wallet}
          assetFullInfo={data.data}
          walletAssetDetails={walletData.data}
        />
        <AssetResources assetFullInfo={data.data} />
        <AssetHistory
          assetId={asset_code}
          asset={asset}
          address={singleAddressNormalized}
        />
        <ReportAssetLink asset={asset} />
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
            <Button kind="primary" size={48}>
              <HStack gap={8} alignItems="center" justifyContent="center">
                <SwapIcon style={{ width: 20, height: 20 }} />
                <UIText kind="body/accent">Swap</UIText>
              </HStack>
            </Button>
            {isEmptyBalance ? null : (
              <>
                <Button
                  kind="primary"
                  size={48}
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
