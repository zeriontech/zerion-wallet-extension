import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { Background } from 'src/ui/components/Background';
import { NavigationTitle } from 'src/ui/components/NavigationTitle';
import { PageBottom } from 'src/ui/components/PageBottom';
import { PageColumn } from 'src/ui/components/PageColumn';
import { PageStickyFooter } from 'src/ui/components/PageStickyFooter';
import { dnaServicePort, walletPort } from 'src/ui/shared/channels';
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
import type { SignMsgBtnHandle } from 'src/ui/components/SignMessageButton';
import { SignMessageButton } from 'src/ui/components/SignMessageButton';
import { invariant } from 'src/shared/invariant';
import { INTERNAL_ORIGIN } from 'src/background/constants';
import { useCurrency } from 'src/modules/currency/useCurrency';
import { UnstyledLink } from 'src/ui/ui-kit/UnstyledLink';
import ArrowLeftTop from 'jsx:src/ui/assets/arrow-left-top.svg';
import { txErrorToMessage } from '../SendTransaction/shared/transactionErrorToMessage';
import { useAddressNftPosition } from './useAddressNftPosition';

export function NonFungibleToken() {
  const { asset_code, chain } = useParams();
  const { singleAddress } = useAddressParams();
  const { data: wallet } = useQuery({
    queryKey: ['wallet/uiGetCurrentWallet'],
    queryFn: () => walletPort.request('uiGetCurrentWallet'),
    useErrorBoundary: true,
  });

  const [contract_address, token_id] = useMemo(
    () => asset_code?.split(':') || [],
    [asset_code]
  );

  // for optimistic update the dna's status after promotion
  const [promotedPrimary, setPromotedAsPrimary] = useState(false);
  const { currency } = useCurrency();

  const { value: nft } = useAddressNftPosition({
    chain: chain || '',
    contract_address,
    token_id,
    currency,
    address: singleAddress,
  });

  const links = useMemo(() => {
    if (!nft?.chain || !nft.contract_address || !nft.token_id) {
      return null;
    }
    const webAppUrlObject = new URL(
      `https://app.zerion.io/nfts/${nft.chain}/${nft.contract_address}:${nft.token_id}`
    );
    if (singleAddress) {
      webAppUrlObject.searchParams.append('address', singleAddress);
    }
    const sendFormParams = new URLSearchParams({
      type: 'nft',
      nftContractAddress: nft.contract_address,
      nftId: nft.token_id,
      tokenChain: nft.chain,
      // nftChain: nft.chain, // nftChain is synced with tokenChain
    });
    return {
      webAppLink: webAppUrlObject.toString(),
      sendFormLink: `/send-form?${sendFormParams.toString()}`,
    };
  }, [singleAddress, nft]);

  const signMsgBtnRef = useRef<SignMsgBtnHandle | null>(null);

  const { mutate: promoteToken, ...promoteTokenMutation } = useMutation({
    mutationFn: async () => {
      if (!nft?.collection.name) {
        return;
      }
      const collectionName = nft.collection.name;
      const tokenName = nft.token_id;
      const { message, actionId } = await dnaServicePort.request(
        'getPromoteDnaSigningMessage',
        { collectionName, tokenName }
      );
      invariant(signMsgBtnRef.current, 'SignMessageButton not found');
      const signature = await signMsgBtnRef.current.personalSign({
        params: [message],
        initiator: INTERNAL_ORIGIN,
        clientScope: null,
      });
      await dnaServicePort.request('promoteDnaToken', {
        address: singleAddress,
        actionId,
        signature,
        tokenName,
      });
      return;
    },
    onSuccess: () => setPromotedAsPrimary(true),
    onError: () => setPromotedAsPrimary(false),
  });

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
              <VStack gap={8}>
                {promoteTokenMutation.isError ? (
                  <UIText kind="body/regular" color="var(--negative-500)">
                    {txErrorToMessage(promoteTokenMutation.error)}
                  </UIText>
                ) : null}
                {!wallet ? null : isPrimary ? (
                  <Button disabled={true}>Active</Button>
                ) : (
                  <SignMessageButton
                    ref={signMsgBtnRef}
                    wallet={wallet}
                    onClick={() => promoteToken()}
                    buttonTitle={
                      <HStack
                        gap={8}
                        alignItems="center"
                        justifyContent="center"
                      >
                        <div>Set as Active</div>
                        {promoteTokenMutation.isLoading ? (
                          <CircleSpinner />
                        ) : null}
                      </HStack>
                    }
                    disabled={promoteTokenMutation.isLoading}
                  />
                )}
              </VStack>
            ) : null}
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
