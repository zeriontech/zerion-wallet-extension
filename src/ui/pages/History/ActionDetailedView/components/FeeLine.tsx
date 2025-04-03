import type { AddressAction } from 'defi-sdk';
import React from 'react';
import { useCurrency } from 'src/modules/currency/useCurrency';
import { createChain } from 'src/modules/networks/Chain';
import { NetworkId } from 'src/modules/networks/NetworkId';
import type { Networks } from 'src/modules/networks/Networks';
import { baseToCommon } from 'src/shared/units/convert';
import { formatCurrencyValue } from 'src/shared/units/formatCurrencyValue';
import { formatTokenValue } from 'src/shared/units/formatTokenValue';
import { AssetLink } from 'src/ui/components/AssetLink';
import { HStack } from 'src/ui/ui-kit/HStack';
import { UIText } from 'src/ui/ui-kit/UIText';

export function FeeLine({
  action,
  address,
  networks,
}: {
  action: AddressAction;
  address?: string;
  networks: Networks;
}) {
  const { fee, chain, sponsored } = action.transaction;
  const { currency } = useCurrency();

  const feeEth = baseToCommon(
    fee?.quantity || 0,
    networks.getNetworkByName(createChain(chain))?.native_asset?.decimals || 18
  );
  const feeCurrency = feeEth.times(Number(fee?.price));
  const nativeAsset = networks.getNetworkByName(
    createChain(chain || NetworkId.Ethereum)
  )?.native_asset;

  const noFeeData = !sponsored && !fee;
  if (noFeeData || !nativeAsset) {
    return null;
  }

  return (
    <HStack
      gap={24}
      alignItems="center"
      justifyContent="space-between"
      style={{ gridTemplateColumns: 'auto 1fr' }}
    >
      <UIText kind="small/regular">Network Fee</UIText>
      <UIText kind="small/accent" style={{ justifySelf: 'end' }}>
        {sponsored ? (
          <div
            style={{
              background: 'linear-gradient(90deg, #6C6CF9 0%, #FF7583 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Free
          </div>
        ) : (
          <HStack gap={4}>
            <span>{formatTokenValue(feeEth, '')}</span>
            {nativeAsset.id ? (
              <AssetLink
                asset={{
                  asset_code: nativeAsset.id,
                  name: nativeAsset.name,
                  symbol: nativeAsset.symbol,
                }}
                address={address}
              />
            ) : (
              nativeAsset.symbol?.toUpperCase()
            )}
            <span>({formatCurrencyValue(feeCurrency, 'en', currency)})</span>
          </HStack>
        )}
      </UIText>
    </HStack>
  );
}
