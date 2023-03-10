import React, { useEffect, useMemo, useState } from 'react';
import { useMutation } from 'react-query';
import { useParams } from 'react-router-dom';
import { Background } from 'src/ui/components/Background';
import { NavigationTitle } from 'src/ui/components/NavigationTitle';
import { PageBottom } from 'src/ui/components/PageBottom';
import { PageColumn } from 'src/ui/components/PageColumn';
import { PageStickyFooter } from 'src/ui/components/PageStickyFooter';
import { dnaServicePort } from 'src/ui/shared/channels';
import { useAddressParams } from 'src/ui/shared/user-address/useAddressParams';
import { Button } from 'src/ui/ui-kit/Button';
import { CircleSpinner } from 'src/ui/ui-kit/CircleSpinner';
import { HStack } from 'src/ui/ui-kit/HStack';
import { MediaContent } from 'src/ui/ui-kit/MediaContent';
import { Spacer } from 'src/ui/ui-kit/Spacer';
import { TextAnchor } from 'src/ui/ui-kit/TextAnchor';
import { UIText } from 'src/ui/ui-kit/UIText';
import { UnstyledAnchor } from 'src/ui/ui-kit/UnstyledAnchor';
import { VStack } from 'src/ui/ui-kit/VStack';
import { useNFTPosition } from './useNftPosition';

export function NonFungibleToken() {
  const { asset_code, chain } = useParams();
  const { singleAddress } = useAddressParams();

  const [contract_address, token_id] = useMemo(
    () => asset_code?.split(':') || [],
    [asset_code]
  );

  // for optimistic update the dna's status after promotion
  const [promotedPrimary, setPromotedAsPrimary] = useState(false);

  const { value: nft } = useNFTPosition({
    chain: chain || '',
    contract_address,
    token_id,
    currency: 'usd',
    address: singleAddress,
  });

  const url = useMemo(() => {
    if (!nft?.chain || !nft.contract_address || !nft.token_id) {
      return null;
    }
    const urlObject = new URL(
      `https://app.zerion.io/nfts/${nft.chain}/${nft.contract_address}:${nft.token_id}`
    );
    if (singleAddress) {
      urlObject.searchParams.append('address', singleAddress);
    }
    return urlObject.toString();
  }, [singleAddress, nft]);

  const { mutate: promoteTokenMutation, isLoading } = useMutation(
    async () => {
      if (!nft?.collection.name) {
        return;
      }
      await dnaServicePort.request('promoteDnaToken', {
        address: singleAddress,
        collectionName: nft.collection.name,
        tokenName: nft.token_id,
      });
      return;
    },
    {
      onMutate: () => setPromotedAsPrimary(true),
      onError: () => setPromotedAsPrimary(false),
    }
  );

  useEffect(() => window.scrollTo(0, 0), []);

  const nftTags = useMemo(() => new Set(nft?.metadata.tags || []), [nft]);
  const isPrimary = promotedPrimary || nftTags.has('#primary');

  return (
    <Background backgroundKind="white">
      <PageColumn style={{ paddingTop: 18 }}>
        <NavigationTitle
          title={
            nft ? `${nft.collection.name} • ${nft.metadata.name}` : 'NFT Info'
          }
        />
        {nft ? (
          <VStack gap={24}>
            <div
              style={{
                maxWidth: 320,
                minHeight: 320,
                marginLeft: 'auto',
                marginRight: 'auto',
                borderRadius: 8,
                overflow: 'hidden',
                textAlign: 'center',
                position: 'relative',
              }}
            >
              <MediaContent
                content={nft.metadata.content}
                alt={`${nft.metadata.name} content`}
                style={{ display: 'block', maxHeight: 320 }}
                errorStyle={{
                  width: 320,
                  height: 320,
                }}
              />
            </div>

            {nftTags.has('#dna') ? (
              <VStack gap={8}>
                <HStack gap={6}>
                  <UIText kind="headline/h3">Zerion DNA:</UIText>
                  <UIText
                    kind="headline/h3"
                    color={
                      isPrimary ? 'var(--positive-500)' : 'var(--neutral-600)'
                    }
                  >
                    {isPrimary ? 'Active' : 'Disabled'}
                  </UIText>
                </HStack>

                <HStack gap={4}>
                  <UIText kind="small/regular">
                    Only one DNA NFT can be active at a time.
                  </UIText>
                  <UIText kind="small/accent">
                    <TextAnchor
                      href="https://zerion.io/blog/zerion-dna/"
                      rel="noopener noreferrer"
                      target="_blank"
                      style={{
                        display: 'inline',
                        color: 'var(--primary)',
                        cursor: 'pointer',
                      }}
                    >
                      Read more
                    </TextAnchor>
                  </UIText>
                </HStack>
              </VStack>
            ) : null}
            {nftTags.has('#dna') ? (
              <Button
                disabled={isPrimary || isLoading}
                onClick={() => promoteTokenMutation()}
              >
                <HStack gap={8} alignItems="center" justifyContent="center">
                  <div>{isPrimary ? 'Active' : 'Set as Active'}</div>
                  {isLoading ? <CircleSpinner /> : null}
                </HStack>
              </Button>
            ) : null}
          </VStack>
        ) : null}
        <Spacer height={24} />
      </PageColumn>
      {url ? (
        <PageStickyFooter
          lineColor="var(--neutral-300)"
          style={{ backgroundColor: 'var(--white)' }}
        >
          <Spacer height={24} />
          <Button
            as={UnstyledAnchor}
            href={url}
            target="_blank"
            kind="regular"
            style={{ width: '100%' }}
          >
            Open in Zerion Web
          </Button>
          <PageBottom />
        </PageStickyFooter>
      ) : null}
    </Background>
  );
}
