import { useAddressPositions } from 'defi-sdk';
import React from 'react';
import { getCommonQuantity } from 'src/shared/units/assetQuantity';
import { formatCurrencyValue } from 'src/shared/units/formatCurrencyValue';
import { formatTokenValue } from 'src/shared/units/formatTokenValue';
import { useAddressParams } from 'src/ui/shared/user-address/useAddressParams';
import { HStack } from 'src/ui/ui-kit/HStack';
import { Media } from 'src/ui/ui-kit/Media';
import { SurfaceList } from 'src/ui/ui-kit/SurfaceList';
import { TokenIcon } from 'src/ui/ui-kit/TokenIcon';
import { UIText } from 'src/ui/ui-kit/UIText';
import { VStack } from 'src/ui/ui-kit/VStack';
import WalletPositionIcon from 'src/ui/assets/wallet-position.svg';

export function Positions() {
  const { ready, params } = useAddressParams();
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
  console.log(value?.positions);
  return (
    <VStack gap={12}>
      <SurfaceList
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
          ...value.positions
            .filter((position) => position.type === 'asset')
            .map((position) => ({
              key: position.id,
              component: (
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
                      <UIText kind="subtitle/m_med">
                        {position.asset.name}
                      </UIText>
                    }
                    detailText={
                      position.quantity ? (
                        <UIText
                          kind="subtitle/m_reg"
                          color="var(--neutral-500)"
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
              ),
            })),
        ]}
      />
    </VStack>
  );
}
