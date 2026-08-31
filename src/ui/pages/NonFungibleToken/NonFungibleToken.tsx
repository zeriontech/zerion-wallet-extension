import React, { useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { Background } from 'src/ui/components/Background';
import { NavigationTitle } from 'src/ui/components/NavigationTitle';
import { PageBottom } from 'src/ui/components/PageBottom';
import { PageColumn } from 'src/ui/components/PageColumn';
import { PageStickyFooter } from 'src/ui/components/PageStickyFooter';
import { useAddressParams } from 'src/ui/shared/user-address/useAddressParams';
import { Button } from 'src/ui/ui-kit/Button';
import { HStack } from 'src/ui/ui-kit/HStack';
import { MediaContent, convertMediaContent } from 'src/ui/ui-kit/MediaContent';
import { Spacer } from 'src/ui/ui-kit/Spacer';
import { UnstyledAnchor } from 'src/ui/ui-kit/UnstyledAnchor';
import { VStack } from 'src/ui/ui-kit/VStack';
import { useCurrency } from 'src/modules/currency/useCurrency';
import { UnstyledLink } from 'src/ui/ui-kit/UnstyledLink';
import ArrowLeftTop from 'jsx:src/ui/assets/arrow-left-top.svg';
import { useHttpClientSource } from 'src/modules/zerion-api/hooks/useHttpClientSource';
import { useWalletNftPosition } from 'src/modules/zerion-api/hooks/useWalletNftPosition';

export function NonFungibleToken() {
  const { asset_code, chain } = useParams();
  const { singleAddress } = useAddressParams();
  const { currency } = useCurrency();
  const source = useHttpClientSource();

  // The route's asset_code is `${contractAddress}:${tokenId}`, so prepending
  // the chain yields the ZPI nftId scheme `${chain}:${contractAddress}:${tokenId}`
  const nftId = `${chain}:${asset_code}`;
  const { data } = useWalletNftPosition(
    { address: singleAddress, currency, nftId },
    { source },
    { enabled: Boolean(chain && asset_code && singleAddress) }
  );
  const nft = data?.data.nft;

  const links = useMemo(() => {
    if (!nft) {
      return null;
    }
    const webAppUrlObject = new URL(
      `https://app.zerion.io/nfts/${nft.chain}/${nft.contractAddress}:${nft.tokenId}`
    );
    if (singleAddress) {
      webAppUrlObject.searchParams.append('address', singleAddress);
    }
    const sendFormParams = new URLSearchParams({
      nftId: `${nft.contractAddress}:${nft.tokenId}`,
      inputChain: nft.chain,
    });
    return {
      webAppLink: webAppUrlObject.toString(),
      sendFormLink: `/send-form?${sendFormParams.toString()}`,
    };
  }, [singleAddress, nft]);

  useEffect(() => window.scrollTo(0, 0), []);

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
                content={convertMediaContent(nft.metadata.content)}
                alt={`${nft.metadata.name} content`}
                style={{ display: 'block', maxHeight: 320 }}
                errorStyle={{
                  width: 320,
                  height: 320,
                }}
              />
            </div>
          </VStack>
        ) : null}
        <Spacer height={24} />
      </PageColumn>
      {links ? (
        <PageStickyFooter
          lineColor="var(--neutral-300)"
          style={{ backgroundColor: 'var(--white)' }}
        >
          <Spacer height={24} />
          <HStack
            gap={8}
            alignItems="center"
            style={{ gridTemplateColumns: '1fr 1fr' }}
          >
            <Button
              as={UnstyledAnchor}
              href={links.webAppLink}
              target="_blank"
              kind="regular"
              style={{ width: '100%' }}
            >
              <HStack gap={8} alignItems="center">
                <span>Zerion Web</span>
                <ArrowLeftTop />
              </HStack>
            </Button>
            <Button
              as={UnstyledLink}
              to={links.sendFormLink}
              kind="primary"
              style={{ width: '100%' }}
            >
              Send NFT
            </Button>
          </HStack>
          <PageBottom />
        </PageStickyFooter>
      ) : null}
    </Background>
  );
}
