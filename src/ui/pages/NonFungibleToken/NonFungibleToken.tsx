import React, { useMemo, useState } from 'react';
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
import { useNftInfo } from './useNftInfo';

export function NonFungibleToken() {
  const { asset_code } = useParams();
  const { singleAddress } = useAddressParams();

  // for optimistic update the dna's status after promotion
  const [promotedPrimary, setPromotedAsPrimary] = useState(false);

  const { value } = useNftInfo({
    asset_code: asset_code || '',
    currency: 'usd',
  });

  const nftTags = useMemo(
    () => new Set(value?.asset.tags?.split(' ')),
    [value]
  );

  const url = useMemo(() => {
    const urlObject = new URL(
      `https://app.zerion.io/nfts/${value?.asset.asset_code}`
    );
    if (singleAddress) {
      urlObject.searchParams.append('address', singleAddress);
    }
    return urlObject.toString();
  }, [singleAddress, value?.asset.asset_code]);

  const { mutate: promoteTokenMutation, isLoading } = useMutation(
    async () => {
      if (!value?.asset.collection_info) {
        return;
      }
      await dnaServicePort.request('promoteDnaToken', {
        address: singleAddress,
        collectionName: value.asset.collection_info.name,
        tokenName: value.asset.token_id,
      });
      return;
    },
    {
      onMutate: () => setPromotedAsPrimary(true),
      onError: () => setPromotedAsPrimary(false),
    }
  );

  const isPrimary = promotedPrimary || nftTags.has('#primary');

  return (
    <Background backgroundKind="transparent">
      <PageColumn style={{ paddingTop: 18 }}>
        <NavigationTitle
          title={
            value
              ? `${value.collection_info?.name} • ${value.asset.name}`
              : 'NFT Info'
          }
        />
        {value ? (
          <VStack gap={24}>
            <div
              style={{
                maxWidth: 240,
                minHeight: 240,
                marginLeft: 'auto',
                marginRight: 'auto',
                borderRadius: 8,
                overflow: 'hidden',
                textAlign: 'center',
                position: 'relative',
              }}
            >
              <MediaContent
                content={value.asset.detail}
                alt={`${value.asset.name} content`}
                style={{ display: 'block', width: '100%' }}
                errorStyle={{
                  width: 276,
                  height: 276,
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
    </Background>
  );
}
