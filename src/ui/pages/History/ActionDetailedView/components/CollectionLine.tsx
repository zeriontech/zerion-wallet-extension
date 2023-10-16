import React, { useMemo } from 'react';
import { getNftAsset } from 'src/modules/ethereum/transactions/actionAsset';
import type { AnyAddressAction } from 'src/modules/ethereum/transactions/addressAction';
import { HStack } from 'src/ui/ui-kit/HStack';
import { TokenIcon } from 'src/ui/ui-kit/TokenIcon';
import { UIText } from 'src/ui/ui-kit/UIText';

export function CollectionLine({ action }: { action: AnyAddressAction }) {
  const { content } = action;

  const nftCollection = useMemo(() => {
    const incomingNftCollection = getNftAsset(
      content?.transfers?.incoming?.find(({ asset }) => 'nft' in asset)?.asset
    )?.collection;
    const outgoingNftCollection = getNftAsset(
      content?.transfers?.outgoing?.find(({ asset }) => 'nft' in asset)?.asset
    )?.collection;
    return incomingNftCollection || outgoingNftCollection;
  }, [content]);

  if (!nftCollection) {
    return null;
  }

  return (
    <HStack
      gap={24}
      alignItems="center"
      justifyContent="space-between"
      style={{ gridTemplateColumns: 'auto 1fr' }}
    >
      <UIText kind="small/regular">Collection</UIText>
      <HStack
        gap={8}
        alignItems="center"
        style={{ gridTemplateColumns: 'auto 1fr', justifySelf: 'end' }}
      >
        <TokenIcon
          src={nftCollection.icon_url}
          size={20}
          symbol={nftCollection.name}
          title={nftCollection.name}
          style={{ borderRadius: 4 }}
        />
        <UIText
          kind="small/accent"
          style={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {nftCollection.name}
        </UIText>
      </HStack>
    </HStack>
  );
}
