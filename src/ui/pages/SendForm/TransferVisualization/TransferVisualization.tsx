import type { AddressNFT, AddressPosition } from 'defi-sdk';
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
import { SquareElement } from 'src/ui/ui-kit/SquareElement';
import { MediaContent } from 'src/ui/ui-kit/MediaContent';

type FormAsset = Pick<AddressPosition, 'asset'>;
export function TransferVisualization({
  tokenItem,
  nftItem,
  amount,
  to,
}: {
  amount: string;
  to: string;
} & (
  | { tokenItem: FormAsset; nftItem?: undefined }
  | { nftItem: AddressNFT; tokenItem?: undefined }
)) {
  const { data: existingWallet } = useQuery({
    queryKey: ['wallet/uiGetWalletByAddress', to],
    queryFn: () =>
      walletPort.request('uiGetWalletByAddress', {
        address: to,
        groupId: null,
      }),
    useErrorBoundary: true,
    suspense: false,
  });
  const wallet = existingWallet || { name: null, address: to };
  return (
    <VStack gap={4} style={{ justifyItems: 'center' }}>
      {tokenItem ? (
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
      ) : nftItem ? (
        <SquareElement
          style={{ height: 104 }}
          render={(style) => (
            <MediaContent
              content={nftItem.metadata.content}
              alt={`${nftItem.metadata.name} image`}
              style={{
                ...style,
                aspectRatio: 'auto',
                display: 'block',
                borderRadius: 16,
                border: '3px solid var(--z-index-1)',
                boxShadow: 'var(--elevation-300)',
                objectFit: 'contain',
              }}
            />
          )}
        />
      ) : null}
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
