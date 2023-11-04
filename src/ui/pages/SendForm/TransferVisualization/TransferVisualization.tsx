import type { AddressPosition } from 'defi-sdk';
import React from 'react';
import { formatTokenValue } from 'src/shared/units/formatTokenValue';
import { Media } from 'src/ui/ui-kit/Media';
import { TokenIcon } from 'src/ui/ui-kit/TokenIcon';
import { UIText } from 'src/ui/ui-kit/UIText';
import { VStack } from 'src/ui/ui-kit/VStack';
import ArrowDown from 'jsx:src/ui/assets/arrow-down.svg';
import { Composition, WalletMedia } from 'src/ui/components/WalletMedia';
import { useQuery } from '@tanstack/react-query';
import { walletPort } from 'src/ui/shared/channels';

export function TransferVisualization({
  tokenItem,
  amount,
  to,
}: {
  tokenItem: Pick<AddressPosition, 'asset'>;
  amount: string;
  to: string;
}) {
  const { data: existingWallet } = useQuery({
    queryKey: ['wallet/uiGetWalletByAddress', to],
    queryFn: () => walletPort.request('uiGetWalletByAddress', { address: to }),
    useErrorBoundary: true,
    suspense: false,
  });
  const wallet = existingWallet || { name: null, address: to };
  return (
    <VStack gap={4} style={{ justifyItems: 'center' }}>
      <Media
        image={
          <TokenIcon
            src={tokenItem.asset.icon_url}
            symbol={tokenItem.asset.symbol}
          />
        }
        text={
          <UIText kind="headline/h2">
            {formatTokenValue(amount)} {tokenItem.asset.symbol}
          </UIText>
        }
        detailText={null}
      />
      <ArrowDown style={{ color: 'var(--neutral-500)' }} />
      <WalletMedia
        iconSize={24}
        activeIndicator={false}
        wallet={wallet}
        composition={Composition.name}
        textKind="headline/h2"
      />
    </VStack>
  );
}
