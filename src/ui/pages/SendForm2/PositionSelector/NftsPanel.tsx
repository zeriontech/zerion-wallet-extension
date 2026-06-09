import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  SelectItem,
  SelectList,
  SelectProvider,
  TabProvider,
} from '@ariakit/react';
import type { Networks } from 'src/modules/networks/Networks';
import { createChain } from 'src/modules/networks/Chain';
import { useCurrency } from 'src/modules/currency/useCurrency';
import { UIText } from 'src/ui/ui-kit/UIText';
import { Button } from 'src/ui/ui-kit/Button';
import { SquareElement } from 'src/ui/ui-kit/SquareElement';
import { Image2 } from 'src/ui/ui-kit/MediaFallback';
import { useDialog2 } from 'src/ui/ui-kit/ModalDialogs/Dialog2';
import { KeyboardShortcut } from 'src/ui/components/KeyboardShortcut';
import { useWalletNftPositions } from 'src/modules/zerion-api/hooks/useWalletNftPositions';
import { useHttpClientSource } from 'src/modules/zerion-api/hooks/useHttpClientSource';
import type { NftPosition } from 'src/modules/zerion-api/requests/wallet-get-nft-positions';
import {
  ALL_NETWORKS_TAB_ID,
  NetworkChips,
  TabPanelWrapper,
} from 'src/ui/components/PositionSelector/NetworkChips';
import * as chipStyles from 'src/ui/components/PositionSelector/styles.module.css';
import { NetworkSelect2 } from 'src/ui/components/NetworkSelect2';
import { NetworkSelectValue } from 'src/modules/networks/NetworkSelectValue';
import { getAddressType } from 'src/shared/wallet/classifiers';
import * as styles from './NftsPanel.module.css';

const COLUMNS = 4;
const SKELETON_COUNT = 12;
const NEXT_PAGE_SKELETON_COUNT = 4;
const CHIP_SKELETON_COUNT = 5;
const SENTINEL_VALUE = 'not-an-item';

function NftErrorPlaceholder() {
  return (
    <div className={styles.placeholder} title="Image failed to load">
      <span aria-hidden="true">🖼</span>
    </div>
  );
}

function NftSkeletonItem() {
  return (
    <div className={styles.gridItem}>
      <div className={styles.gridItemContent}>
        <SquareElement
          render={(style) => (
            <div style={style} className={styles.skeletonSquare} />
          )}
        />
      </div>
      <div className={styles.skeletonLabel} />
    </div>
  );
}

function NftGridSkeleton() {
  return (
    <div className={styles.gridWrapper}>
      <div className={styles.grid}>
        {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
          <NftSkeletonItem key={i} />
        ))}
      </div>
    </div>
  );
}

function ChipStripSkeleton() {
  return (
    <div className={chipStyles.chipsContainer}>
      <div className={chipStyles.chipsScroll} aria-hidden="true">
        {Array.from({ length: CHIP_SKELETON_COUNT }).map((_, i) => (
          <div key={i} className={styles.chipSkeleton} />
        ))}
      </div>
    </div>
  );
}

function NftGridItem({
  position,
  index,
}: {
  position: NftPosition;
  index: number;
}) {
  const displayName =
    position.nft.name ||
    position.nft.metadata.name ||
    position.nft.collection.name ||
    `#${position.nft.tokenId}`;
  const quantity = Number(position.amount.quantity);
  const rowId = String(Math.ceil((index + 1) / COLUMNS));
  return (
    <SelectItem
      value={position.nft.id}
      rowId={rowId}
      className={styles.gridItem}
      focusOnHover={false}
    >
      <div className={styles.gridItemContent}>
        <SquareElement
          render={(style) => (
            <Image2
              src={position.nft.previewUrl ?? undefined}
              alt={`${displayName} image`}
              renderError={() => <NftErrorPlaceholder />}
              style={{ ...style, borderRadius: 8, objectFit: 'cover' }}
            />
          )}
        />
        {quantity > 1 ? (
          <div className={styles.quantityBadge}>
            <UIText kind="caption/accent" color="var(--white)">
              {quantity}
            </UIText>
          </div>
        ) : null}
      </div>
      <UIText kind="caption/regular" className={styles.gridItemLabel}>
        {displayName}
      </UIText>
    </SelectItem>
  );
}

interface NftsPanelProps {
  address: string;
  networks: Networks;
  /** chainId -> fiat value from WalletPortfolio.nftChainsDistribution */
  nftChainsDistribution: Record<string, number>;
  /** Renders chip-strip skeleton while true. */
  isPortfolioLoading: boolean;
  /** Currently-selected NFT id (ZPI scheme), shows the selection ring. */
  selectedNftId: string | null;
  defaultSelectedNetwork: string | null;
  onSelectedNetworkChange: (chainId: string | null) => void;
  onSelect: (position: NftPosition) => void;
  /** Whether the parent dialog is open; scopes keyboard shortcut. */
  open: boolean;
}

export function NftsPanel({
  address,
  networks,
  nftChainsDistribution,
  isPortfolioLoading,
  selectedNftId,
  defaultSelectedNetwork,
  onSelectedNetworkChange,
  onSelect,
  open,
}: NftsPanelProps) {
  const { currency } = useCurrency();
  const source = useHttpClientSource();
  const [selectedNetwork, setSelectedNetwork] = useState<string | null>(
    defaultSelectedNetwork
  );
  const networkSelector = useDialog2();
  const chipsRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const {
    data: positions,
    isLoading,
    isError,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useWalletNftPositions(
    {
      addresses: [address],
      currency,
      sort: 'floor_price_high',
      chain: selectedNetwork ?? undefined,
      limit: 30,
    },
    { source },
    { suspense: false }
  );

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { rootMargin: '200px' }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage, positions.length]);

  useEffect(() => {
    onSelectedNetworkChange(selectedNetwork);
  }, [selectedNetwork, onSelectedNetworkChange]);

  const topNetworks = useMemo(() => {
    return Object.entries(nftChainsDistribution)
      .sort(([, a], [, b]) => b - a)
      .map(([chainId]) => {
        const network = networks.getByNetworkId(createChain(chainId));
        return {
          chainId,
          name: network?.name ?? chainId,
          iconUrl: network?.icon_url ?? '',
        };
      });
  }, [nftChainsDistribution, networks]);

  const chainDistribution = useMemo(() => {
    const distribution: Record<string, number> = {};
    const chains: Record<string, true> = {};
    let totalValue = 0;
    for (const [chainId, value] of Object.entries(nftChainsDistribution)) {
      distribution[chainId] = value;
      chains[chainId] = true;
      totalValue += value;
    }
    return {
      positionsChainsDistribution: distribution,
      chains,
      totalValue,
    };
  }, [nftChainsDistribution]);

  const allowedChainIds = useMemo(
    () =>
      new Set(
        networks
          .getMainnets()
          .filter((n) => n.supports_nft_positions)
          .map((n) => n.id)
      ),
    [networks]
  );

  const scrollChipIntoView = (chainId: string) => {
    const el = chipsRef.current?.querySelector<HTMLElement>(
      `[data-chain-id="${chainId}"]`
    );
    el?.scrollIntoView({ block: 'nearest', inline: 'center' });
  };

  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      scrollChipIntoView(selectedNetwork ?? ALL_NETWORKS_TAB_ID);
    });
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const showGlobe = topNetworks.length > 0;

  // No-op when the user re-selects the already-selected NFT (matches web app).
  const handleSetValue = useCallback(
    (value: string | readonly string[]) => {
      const id = Array.isArray(value) ? value[0] || '' : (value as string);
      if (!id || id === SENTINEL_VALUE) return;
      if (selectedNftId && id === selectedNftId) return;
      const picked = positions.find((p) => p.nft.id === id);
      if (picked) onSelect(picked);
    },
    [positions, selectedNftId, onSelect]
  );

  const defaultActiveId =
    selectedNftId ?? selectedNetwork ?? ALL_NETWORKS_TAB_ID;

  return (
    <>
      {open && !networkSelector.open && showGlobe ? (
        <KeyboardShortcut
          combination="shift+right"
          availableDuringInputs={true}
          onKeyDown={networkSelector.openDialog}
        />
      ) : null}
      <SelectProvider
        defaultValue={selectedNftId ?? SENTINEL_VALUE}
        defaultActiveId={defaultActiveId}
        setValue={handleSetValue}
        open={true}
        focusLoop={false}
        focusShift={true}
      >
        <TabProvider
          selectedId={selectedNetwork ?? ALL_NETWORKS_TAB_ID}
          setSelectedId={(id) => {
            if (!id) return;
            setSelectedNetwork(id === ALL_NETWORKS_TAB_ID ? null : id);
          }}
        >
          <div className={chipStyles.panelRoot}>
            <div className={chipStyles.fixedHeader}>
              {isPortfolioLoading && topNetworks.length === 0 ? (
                <ChipStripSkeleton />
              ) : (
                <NetworkChips
                  ref={chipsRef}
                  networks={topNetworks}
                  onOpenNetworkSelector={networkSelector.openDialog}
                  showNetworkSelectorTrigger={showGlobe}
                  mode="grid"
                />
              )}
            </div>
            <div className={chipStyles.scrollArea}>
              <TabPanelWrapper>
                {isLoading ? (
                  <NftGridSkeleton />
                ) : isError ? (
                  <div className={chipStyles.emptyState}>
                    <UIText kind="body/regular" color="var(--neutral-500)">
                      Couldn&apos;t load NFTs
                    </UIText>
                    <Button kind="regular" size={36} onClick={() => refetch()}>
                      Retry
                    </Button>
                  </div>
                ) : positions.length === 0 ? (
                  <div className={chipStyles.emptyState}>
                    <UIText kind="body/regular" color="var(--neutral-500)">
                      No NFTs found
                    </UIText>
                  </div>
                ) : (
                  <div className={styles.gridWrapper}>
                    <SelectList className={styles.grid}>
                      {positions.map((position, index) => (
                        <NftGridItem
                          key={position.nft.id}
                          position={position}
                          index={index}
                        />
                      ))}
                      {isFetchingNextPage
                        ? Array.from({
                            length: NEXT_PAGE_SKELETON_COUNT,
                          }).map((_, i) => (
                            <NftSkeletonItem key={`skeleton-${i}`} />
                          ))
                        : null}
                    </SelectList>
                    {hasNextPage ? (
                      <div ref={sentinelRef} style={{ height: 1 }} />
                    ) : null}
                  </div>
                )}
              </TabPanelWrapper>
            </div>
          </div>
        </TabProvider>
      </SelectProvider>
      <NetworkSelect2
        open={networkSelector.open}
        onClose={networkSelector.closeDialog}
        value={selectedNetwork ?? NetworkSelectValue.All}
        chainDistribution={chainDistribution}
        standard={getAddressType(address)}
        showEcosystemHint={true}
        showAllNetworksOption={true}
        filterPredicate={(network) => allowedChainIds.has(network.id)}
        onSelect={(value) => {
          const isAll = value === NetworkSelectValue.All;
          const nextChainId = isAll ? null : value;
          setSelectedNetwork(nextChainId);
          requestAnimationFrame(() => {
            scrollChipIntoView(nextChainId ?? '');
          });
        }}
      />
    </>
  );
}
