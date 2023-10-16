import React from 'react';
import { createChain } from 'src/modules/networks/Chain';
import { NetworkId } from 'src/modules/networks/NetworkId';
import type { Networks } from 'src/modules/networks/Networks';
import { baseToCommon } from 'src/shared/units/convert';
import { formatCurrencyValue } from 'src/shared/units/formatCurrencyValue';
import { formatTokenValue } from 'src/shared/units/formatTokenValue';
import { AssetLink } from 'src/ui/components/AssetLink';
import { HStack } from 'src/ui/ui-kit/HStack';
import { UIText } from 'src/ui/ui-kit/UIText';
import type { AnyAddressAction } from 'src/modules/ethereum/transactions/addressAction';

export function FeeLine({
  action,
  address,
  networks,
}: {
  action: AnyAddressAction;
  address?: string;
  networks: Networks;
}) {
  const { fee, chain } = action.transaction;

  const feeEth = baseToCommon(
    fee?.quantity || 0,
    networks.getNetworkByName(createChain(chain))?.native_asset?.decimals || 18
  );
  const feeCurrency = feeEth.times(Number(fee?.price));
  const nativeAsset = networks.getNetworkByName(
    createChain(chain || NetworkId.Ethereum)
  )?.native_asset;

  if (!fee || !nativeAsset) {
    return null;
  }

  return (
    <HStack
      gap={24}
      alignItems="center"
      justifyContent="space-between"
      style={{ gridTemplateColumns: 'auto 1fr' }}
    >
      <UIText kind="small/regular">Fee</UIText>
      <UIText kind="small/accent" style={{ justifySelf: 'end' }}>
        <HStack gap={4}>
          <span>{formatTokenValue(feeEth, '')}</span>
          <AssetLink
            asset={{
              asset_code: nativeAsset.id,
              name: nativeAsset.name,
              symbol: nativeAsset.symbol,
            }}
            address={address}
          />
          <span>({formatCurrencyValue(feeCurrency, 'en', 'usd')})</span>
        </HStack>
      </UIText>
    </HStack>
  );
}
