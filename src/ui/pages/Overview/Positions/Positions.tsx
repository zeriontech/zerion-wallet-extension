import type { AddressPosition } from 'defi-sdk';
import { useAddressPositions } from 'defi-sdk';
import React, { useCallback, useMemo, useState } from 'react';
import { getCommonQuantity } from 'src/shared/units/assetQuantity';
import { formatCurrencyValue } from 'src/shared/units/formatCurrencyValue';
import { formatTokenValue } from 'src/shared/units/formatTokenValue';
import { useAddressParams } from 'src/ui/shared/user-address/useAddressParams';
import { HStack } from 'src/ui/ui-kit/HStack';
import { Media } from 'src/ui/ui-kit/Media';
import { TokenIcon } from 'src/ui/ui-kit/TokenIcon';
import { UIText } from 'src/ui/ui-kit/UIText';
import { Image } from 'src/ui/ui-kit/MediaFallback';
import WalletPositionIcon from 'jsx:src/ui/assets/wallet-position.svg';
// import { VirtualizedSurfaceList } from 'src/ui/ui-kit/SurfaceList/VirtualizedSurfaceList';
import { Item, SurfaceList } from 'src/ui/ui-kit/SurfaceList';
import {
  DEFAULT_PROTOCOL,
  PositionsGroupType,
} from 'src/ui/components/Positions/types';
import {
  clearMissingParentIds,
  groupPositionsByName,
  groupPositionsByProtocol,
  sortPositionGroupsByTotalValue,
  sortPositionsByParentId,
  sortPositionsByValue,
} from 'src/ui/components/Positions/groupPositions';
import { VStack } from 'src/ui/ui-kit/VStack';
import {
  getChainIconURL,
  getFullPositionsValue,
  getProtocolIconURL,
  positionTypeToStringMap,
} from 'src/ui/components/Positions/helpers';
import { formatPercent } from 'src/shared/units/formatPercent/formatPercent';
import { NetworkId } from 'src/modules/networks/NetworkId';
import { useNetworks } from 'src/modules/networks/useNetworks';
import { createChain } from 'src/modules/networks/Chain';
import { ViewLoading } from 'src/ui/components/ViewLoading';
import * as s from './styles.module.css';

function LineToParent({
  hasPreviosNestedPosition,
}: {
  hasPreviosNestedPosition?: boolean;
}) {
  return hasPreviosNestedPosition ? (
    <svg
      style={{
        position: 'absolute',
        left: 0,
        bottom: 15,
        width: 26,
        height: 56,
      }}
    >
      <path
        d="M2 3L2 50C2 51.58 3 53 5 53L17 53"
        stroke="var(--neutral-300)"
        strokeWidth="2"
        strokeLinecap="round"
        fillOpacity="0"
      />
    </svg>
  ) : (
    <svg
      style={{
        position: 'absolute',
        left: 0,
        bottom: 15,
        width: 26,
        height: 36,
      }}
    >
      <path
        d="M2 4L2 30C2 32.2 3.8 34 6 34L17 34"
        stroke="var(--neutral-300)"
        strokeWidth="2"
        strokeLinecap="round"
        fillOpacity="0"
      />
      <circle
        cx="2"
        cy="4"
        r="1.5"
        fill="var(--neutral-300)"
        stroke="var(--neutral-300)"
      />
    </svg>
  );
}

function intersperce<T>(arr: T[], getJoiner: (index: number) => T): T[] {
  const result: T[] = [];
  arr.forEach((el, index) => {
    result.push(el);
    if (index < arr.length - 1) {
      result.push(getJoiner(index));
    }
  });
  return result;
}

const textOverflowStyle: React.CSSProperties = {
  overflow: 'hidden',
  whiteSpace: 'nowrap',
  textOverflow: 'ellipsis',
};
function AddressPositionItem({
  position,
  hasPreviosNestedPosition,
  getChainName,
  groupType,
}: {
  position: AddressPosition;
  hasPreviosNestedPosition: boolean;
  getChainName: (chain: string) => string;
  groupType: PositionsGroupType;
}) {
  const isNested = Boolean(position.parent_id);

  return (
    <div style={{ position: 'relative', paddingLeft: isNested ? 26 : 0 }}>
      {isNested ? (
        <LineToParent hasPreviosNestedPosition={hasPreviosNestedPosition} />
      ) : null}
      <HStack gap={4} justifyContent="space-between" style={{ flexGrow: 1 }}>
        <Media
          image={
            <TokenIcon
              size={24}
              symbol={position.asset.symbol}
              src={position.asset.icon_url}
            />
          }
          text={
            <UIText kind="subtitle/m_med" style={textOverflowStyle}>
              {position.asset.name}
            </UIText>
          }
          detailText={
            <div
              style={{ color: 'var(--neutral-500)' }}
              className={s.childrenVAlignMiddle}
            >
              {intersperce(
                [
                  position.chain !== NetworkId.Ethereum ? (
                    <React.Fragment key={-1}>
                      <Image
                        style={{
                          width: 12,
                          height: 12,
                          borderRadius: 2,
                          overflow: 'hidden',
                        }}
                        src={getChainIconURL(position.chain)}
                        renderError={() => (
                          <TokenIcon symbol={position.chain} size={16} />
                        )}
                      />{' '}
                      <span>{getChainName(position.chain)}</span>
                    </React.Fragment>
                  ) : undefined,
                  groupType === PositionsGroupType.position ? (
                    <span key={-2}>
                      protocol: {position.protocol || DEFAULT_PROTOCOL}
                    </span>
                  ) : undefined,
                  position.type !== 'asset' ? (
                    <UIText
                      key="position-type"
                      inline={true}
                      kind="subtitle/s_reg"
                      color={
                        position.type === 'loan'
                          ? 'var(--negative-500)'
                          : 'var(--neutral-500)'
                      }
                    >
                      {positionTypeToStringMap[position.type]}
                    </UIText>
                  ) : position.quantity ? (
                    <UIText
                      key="position-quantity"
                      inline={true}
                      kind="subtitle/s_reg"
                      style={textOverflowStyle}
                    >
                      {formatTokenValue(
                        getCommonQuantity({
                          asset: position.asset,
                          quantity: position.quantity,
                          chain: position.chain,
                        }),
                        position.asset.symbol
                      )}
                    </UIText>
                  ) : null,
                ].filter(Boolean),
                (index) => (
                  <span key={index}> · </span>
                )
              )}
            </div>
          }
        />
        {position.value != null ? (
          <VStack gap={4} style={{ textAlign: 'right' }}>
            <UIText kind="subtitle/m_reg">
              {formatCurrencyValue(position.value, 'en', 'usd')}
            </UIText>
            {position.asset.price?.relative_change_24h ? (
              <UIText
                kind="subtitle/s_reg"
                color={
                  position.asset.price.relative_change_24h < 0
                    ? 'var(--negative-500)'
                    : 'var(--positive-500)'
                }
              >
                {position.asset.price.relative_change_24h > 0 ? '+' : null}
                {`${formatPercent(
                  position.asset.price.relative_change_24h,
                  'en'
                )}%`}
              </UIText>
            ) : null}
          </VStack>
        ) : null}
      </HStack>
    </div>
  );
}

interface PreparedPositions {
  items: AddressPosition[];
  totalValue: number;
  protocols: string[];
  protocolIndex: Record<
    string,
    {
      totalValue: number;
      relativeValue: number;
      items: AddressPosition[];
      names: string[];
      nameIndex: Record<string, AddressPosition[]>;
    }
  >;
}

function usePreparedPositions({
  items: unfilteredItems,
  groupType,
}: {
  items: AddressPosition[];
  groupType: PositionsGroupType;
}): PreparedPositions {
  const items = useMemo(
    () =>
      unfilteredItems.filter((item) =>
        item.type === 'asset' ? item.is_displayable : true
      ),
    [unfilteredItems]
  );

  const totalValue = useMemo(() => getFullPositionsValue(items), [items]);
  return useMemo(() => {
    const byProtocol =
      groupType === PositionsGroupType.platform
        ? groupPositionsByProtocol(items)
        : { [DEFAULT_PROTOCOL]: items };
    const byProtocolSorted = sortPositionGroupsByTotalValue(byProtocol);
    const protocols = byProtocolSorted.map(([protocol]) => protocol);
    const protocolIndex: PreparedPositions['protocolIndex'] = {};
    for (const protocol of protocols) {
      const items = sortPositionsByValue(byProtocol[protocol]);
      const currentTotalValue = getFullPositionsValue(items);
      const byName = groupPositionsByName(items);
      const byNameSorted = sortPositionGroupsByTotalValue(byName);
      const names = byNameSorted.map(([name]) => name);
      const nameIndex: PreparedPositions['protocolIndex'][string]['nameIndex'] =
        {};
      for (const name of names) {
        nameIndex[name] = sortPositionsByParentId(
          clearMissingParentIds(byName[name])
        );
      }
      protocolIndex[protocol] = {
        totalValue: currentTotalValue,
        relativeValue: (currentTotalValue / totalValue) * 100,
        items,
        names,
        nameIndex,
      };
    }
    return {
      items,
      totalValue,
      protocols,
      protocolIndex,
    };
  }, [groupType, items, totalValue]);
}

function PositionsList({
  items,
  address,
}: {
  items: AddressPosition[];
  address: string;
}) {
  const COLLAPSED_COUNT = 8;
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());
  const showMore = useCallback(
    (key: string) => setExpanded((expanded) => new Set(expanded).add(key)),
    []
  );
  const showLess = useCallback(
    (key: string) =>
      setExpanded((expanded) => {
        const set = new Set(expanded);
        set.delete(key);
        return set;
      }),
    []
  );
  const groupType = PositionsGroupType.platform;
  const preparedPositions = usePreparedPositions({ items, groupType });
  const { networks } = useNetworks();
  const getChainName = useCallback(
    (chain: string) => networks?.getChainName(createChain(chain)) ?? '',
    [networks]
  );

  return (
    <VStack gap={24}>
      {preparedPositions.protocols.map((protocol) => {
        const items: Item[] = [];
        const {
          totalValue,
          relativeValue,
          names,
          nameIndex,
          items: protocolItems,
        } = preparedPositions.protocolIndex[protocol];
        items.push({
          key: 0,
          style: {
            position: 'sticky',
            zIndex: 1,
            top: 35 + 40, // header + tabs
            borderTopLeftRadius: 'var(--surface-border-radius)',
            borderTopRightRadius: 'var(--surface-border-radius)',
            backgroundColor: 'var(--z-index-1)',
          },
          component: (
            <HStack gap={8} alignItems="center">
              {protocol === DEFAULT_PROTOCOL ? (
                <WalletPositionIcon style={{ width: 28, height: 28 }} />
              ) : (
                <Image
                  src={getProtocolIconURL(protocol)}
                  alt=""
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 4,
                    overflow: 'hidden',
                  }}
                  renderError={() => (
                    <TokenIcon
                      symbol={protocol}
                      size={32}
                      style={{ borderRadius: 8 }}
                    />
                  )}
                />
              )}
              <UIText kind="subtitle/l_med">
                {protocol}
                {' · '}
                {formatCurrencyValue(totalValue, 'en', 'usd')}{' '}
                <UIText
                  inline={true}
                  kind="caption/med"
                  style={{
                    padding: 4,
                    backgroundColor: 'var(--neutral-200)',
                    borderRadius: 4,
                  }}
                >
                  {`${formatPercent(relativeValue, 'en')}%`}
                </UIText>
              </UIText>
            </HStack>
          ),
        });
        let count = 0;
        // do not hide if only one item is left
        const stopAt =
          protocolItems.length - COLLAPSED_COUNT > 1
            ? COLLAPSED_COUNT
            : protocolItems.length;
        outerBlock: for (const name of names) {
          items.push({
            key: name,
            separatorTop: false,
            pad: false,
            component: (
              <UIText
                kind="label/med"
                color="var(--neutral-700)"
                style={{ paddingBottom: 4, paddingTop: 12 }}
              >
                {name.toUpperCase()}
              </UIText>
            ),
          });
          for (const position of nameIndex[name]) {
            items.push({
              key: position.id,
              href: `https://app.zerion.io/explore/asset/${position.asset.symbol}-${position.asset.asset_code}?address=${address}`,
              target: '_blank',
              separatorLeadingInset: position.parent_id ? 26 : 0,
              component: (
                <AddressPositionItem
                  position={position}
                  groupType={groupType}
                  hasPreviosNestedPosition={
                    position.asset.asset_code ===
                    '0xc011a73ee8576fb46f5e1c5751ca3b9fe0af2a6f'
                  }
                  getChainName={getChainName}
                />
              ),
            });
            count++;
            if (count >= stopAt && !expanded.has(protocol)) {
              break outerBlock;
            }
          }
        }
        if (protocolItems.length > stopAt) {
          const howMuchMore = protocolItems.length - stopAt;
          items.push({
            key: 'show-more-less',
            onClick: () => {
              if (expanded.has(protocol)) {
                showLess(protocol);
              } else {
                showMore(protocol);
              }
            },
            component: (
              <UIText kind="body/s_reg" color="var(--primary)">
                {expanded.has(protocol)
                  ? 'Show Less'
                  : `Show More (${howMuchMore})`}
              </UIText>
            ),
          });
        }
        return (
          <SurfaceList
            style={{ position: 'relative' }}
            key={protocol}
            // estimateSize={(index) => (index === 0 ? 52 : 60 + 1)}
            // overscan={5} // the library detects window edge incorrectly, increasing overscan just visually hides the problem
            items={items}
          />
        );
      })}
    </VStack>
  );
}

export function Positions() {
  const { ready, params, singleAddress } = useAddressParams();
  const { value, isLoading } = useAddressPositions(
    {
      ...params,
      currency: 'usd',
    },
    { enabled: ready }
  );

  if (isLoading) {
    return <ViewLoading kind="network" />;
  }

  if (!ready || !value) {
    return null;
  }
  if (value.positions.length === 0) {
    return (
      <UIText
        kind="subtitle/l_reg"
        color="var(--neutral-500)"
        style={{ textAlign: 'center' }}
      >
        No positions
      </UIText>
    );
  }
  return <PositionsList address={singleAddress} items={value.positions} />;
}
