import type { AddressPosition } from 'defi-sdk';
import { useAddressPositions } from 'defi-sdk';
import React from 'react';
import { getCommonQuantity } from 'src/shared/units/assetQuantity';
import { formatCurrencyValue } from 'src/shared/units/formatCurrencyValue';
import { formatTokenValue } from 'src/shared/units/formatTokenValue';
import { useAddressParams } from 'src/ui/shared/user-address/useAddressParams';
import { HStack } from 'src/ui/ui-kit/HStack';
import { Media } from 'src/ui/ui-kit/Media';
import { TokenIcon } from 'src/ui/ui-kit/TokenIcon';
import { UIText } from 'src/ui/ui-kit/UIText';
import WalletPositionIcon from 'src/ui/assets/wallet-position.svg';
import { VirtualizedSurfaceList } from 'src/ui/ui-kit/SurfaceList/VirtualizedSurfaceList';

const textOverflowStyle: React.CSSProperties = {
  overflow: 'hidden',
  whiteSpace: 'nowrap',
  textOverflow: 'ellipsis',
};
function AddressPositionItem({ position }: { position: AddressPosition }) {
  return (
    <HStack gap={4} justifyContent="space-between">
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
          position.quantity ? (
            <UIText
              kind="subtitle/m_reg"
              color="var(--neutral-500)"
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
          ) : null
        }
      />
      {position.value != null ? (
        <UIText kind="subtitle/m_reg">
          {formatCurrencyValue(position.value, 'en', 'usd')}
        </UIText>
      ) : null}
    </HStack>
  );
}

function PositionsList({
  items,
  address,
}: {
  items: AddressPosition[];
  address: string;
}) {
  return (
    <VirtualizedSurfaceList
      estimateSize={(index) => (index === 0 ? 52 : 60 + 1)}
      overscan={5} // the library detects window edge incorrectly, increasing overscan just visually hides the problem
      items={[
        {
          key: 0,
          component: (
            <HStack gap={8} alignItems="center">
              <WalletPositionIcon style={{ width: 28, height: 28 }} />
              <UIText kind="subtitle/l_med">Wallet</UIText>
            </HStack>
          ),
        },
        ...items.map((position) => ({
          key: position.id,
          href: `https://app.zerion.io/explore/asset/${position.asset.symbol}-${position.asset.asset_code}?address=${address}`,
          target: '_blank',
          component: <AddressPositionItem position={position} />,
        })),
      ]}
    />
  );
}

export function Positions() {
  const { ready, params, singleAddress } = useAddressParams();
  const { value } = useAddressPositions(
    {
      ...params,
      currency: 'usd',
    },
    { enabled: ready }
  );
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
  return (
    <PositionsList
      address={singleAddress}
      items={value.positions.filter((position) => position.type === 'asset')}
    />
  );
}
