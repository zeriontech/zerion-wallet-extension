import React, { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { invariant } from 'src/shared/invariant';
import { isReadonlyAccount } from 'src/shared/types/validators';
import { findPerpAsset } from 'src/modules/hyperliquid/findPerpAsset';
import {
  getPerpDisplayName,
  parsePerpId,
} from 'src/modules/hyperliquid/parsePerpId';
import { useClearinghouseState } from 'src/modules/hyperliquid/hooks/useClearinghouseState';
import { useMetaAndAssetCtxs } from 'src/modules/hyperliquid/hooks/useMetaAndAssetCtxs';
import { useUserFills } from 'src/modules/hyperliquid/hooks/useUserFills';
import { useBackgroundKind } from 'src/ui/components/Background';
import { whiteBackgroundKind } from 'src/ui/components/Background/Background';
import { NavigationTitle } from 'src/ui/components/NavigationTitle';
import { PageColumn } from 'src/ui/components/PageColumn';
import { PageTop } from 'src/ui/components/PageTop';
import { PageBottom } from 'src/ui/components/PageBottom';
import { walletPort } from 'src/ui/shared/channels';
import { useAddressParams } from 'src/ui/shared/user-address/useAddressParams';
import { Button } from 'src/ui/ui-kit/Button';
import { HStack } from 'src/ui/ui-kit/HStack';
import { Spacer } from 'src/ui/ui-kit/Spacer';
import { StickyBottomPanel } from 'src/ui/ui-kit/BottomPanel';
import { UIText } from 'src/ui/ui-kit/UIText';
import { UnstyledLink } from 'src/ui/ui-kit/UnstyledLink';
import { VStack } from 'src/ui/ui-kit/VStack';
import { Heading, HeadingSkeleton } from './Blocks/Heading';
import { Toolbar } from './Blocks/Toolbar';
import { PerpScrolledHeader } from './PerpScrolledHeader';
import * as styles from './styles.module.css';
import { ChartBlock } from './Blocks/ChartBlock';
import { StatsBlock, StatsBlockSkeleton } from './Blocks/StatsBlock';
import { PositionBlock, PositionBlockSkeleton } from './Blocks/PositionBlock';
import { HistoryBlock, HistoryBlockSkeleton } from './Blocks/HistoryBlock';
import { RiskDisclosureBlock } from './Blocks/RiskDisclosureBlock';

export function PerpPage() {
  useBackgroundKind(whiteBackgroundKind);
  const { perp_id: perpId } = useParams();
  invariant(perpId, 'perp_id is required');
  const parsed = useMemo(() => parsePerpId(perpId), [perpId]);
  const displayName = getPerpDisplayName(parsed.coin);

  const { singleAddress: address } = useAddressParams();

  const { data: ctxData } = useMetaAndAssetCtxs({
    dexIdentifier: parsed.dexIdentifier,
  });
  const asset = useMemo(
    () => findPerpAsset(ctxData, parsed.coin),
    [ctxData, parsed.coin]
  );

  const { data: clearingState, isLoading: positionLoading } =
    useClearinghouseState(
      { address, dexIdentifier: parsed.dexIdentifier },
      { enabled: Boolean(address) }
    );
  const { data: fillsData, isLoading: fillsLoading } = useUserFills(
    { address },
    { enabled: Boolean(address) }
  );

  const position = useMemo(() => {
    if (!clearingState) return null;
    const entry = clearingState.assetPositions.find(
      (e) => e.position.coin.toLowerCase() === parsed.coin.toLowerCase()
    );
    return entry?.position ?? null;
  }, [clearingState, parsed.coin]);

  const fillsForCoin = useMemo(() => {
    if (!fillsData) return [];
    return fillsData.filter(
      (fill) => fill.coin.toLowerCase() === parsed.coin.toLowerCase()
    );
  }, [fillsData, parsed.coin]);

  const showPositionSection = Boolean(address) && position != null;
  const showHistorySection = Boolean(address) && fillsForCoin.length > 0;
  const showRiskDisclosure = Boolean(address);

  const { data: wallet } = useQuery({
    queryKey: ['wallet/uiGetCurrentWallet'],
    queryFn: () => walletPort.request('uiGetCurrentWallet'),
  });
  const isWatchedAddress = wallet ? isReadonlyAccount(wallet) : false;
  const hasPosition = position != null;
  const showFooter = Boolean(address) && !isWatchedAddress && !positionLoading;
  const tradePath = `/perps/${encodeURIComponent(perpId)}/trade`;

  return (
    <PageColumn>
      <NavigationTitle
        title={
          <div className={styles.headerContainer}>
            <Toolbar
              coin={parsed.coin}
              displayName={displayName}
              className={styles.defaultHeader}
            />
            <PerpScrolledHeader
              coin={parsed.coin}
              displayName={displayName}
              asset={asset}
              className={styles.header}
            />
          </div>
        }
        documentTitle={`${displayName} Perps`}
      />
      <PageTop />
      <VStack gap={12}>
        {asset ? <Heading asset={asset} /> : <HeadingSkeleton />}
        <ChartBlock
          coin={parsed.coin}
          fills={fillsForCoin}
          displayName={displayName}
        />
        {asset ? <StatsBlock asset={asset} /> : <StatsBlockSkeleton />}
      </VStack>
      <Spacer height={12} />
      {address && positionLoading && !position ? (
        <>
          <PositionBlockSkeleton />
          <Spacer height={24} />
        </>
      ) : null}
      {showPositionSection && position ? (
        <>
          <PositionBlock position={position} displayName={displayName} />
          <Spacer height={24} />
        </>
      ) : null}
      {address && fillsLoading && fillsForCoin.length === 0 ? (
        <>
          <HistoryBlockSkeleton />
          <Spacer height={24} />
        </>
      ) : null}
      {showHistorySection ? (
        <>
          <HistoryBlock fills={fillsForCoin} displayName={displayName} />
          <Spacer height={24} />
        </>
      ) : null}
      {showRiskDisclosure ? <RiskDisclosureBlock /> : null}
      <PageBottom />
      {showFooter ? (
        <StickyBottomPanel
          style={{ padding: 0, background: 'none', boxShadow: 'none' }}
          backdropStyle={{ inset: '-16px -16px 0' }}
        >
          {hasPosition ? (
            <HStack
              gap={8}
              style={{
                width: '100%',
                gridTemplateColumns: '1fr 1fr',
              }}
            >
              <Button
                kind="primary"
                size={48}
                as={UnstyledLink}
                to={`${tradePath}?mode=add`}
              >
                <UIText kind="body/accent">Add</UIText>
              </Button>
              <Button
                kind="regular"
                size={48}
                as={UnstyledLink}
                to={`${tradePath}?mode=close`}
              >
                <UIText kind="body/accent">Close</UIText>
              </Button>
            </HStack>
          ) : (
            <HStack
              gap={8}
              style={{
                width: '100%',
                gridTemplateColumns: '1fr 1fr',
              }}
            >
              <Button
                kind="primary"
                size={48}
                as={UnstyledLink}
                to={`${tradePath}?mode=open&side=long`}
              >
                <UIText kind="body/accent">Long</UIText>
              </Button>
              <Button
                kind="primary"
                size={48}
                as={UnstyledLink}
                to={`${tradePath}?mode=open&side=short`}
              >
                <UIText kind="body/accent">Short</UIText>
              </Button>
            </HStack>
          )}
        </StickyBottomPanel>
      ) : null}
    </PageColumn>
  );
}
