import React, { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { payloadId } from '@json-rpc-tools/utils';
import { v4 as uuidv4 } from 'uuid';
import { animated, useSpring } from '@react-spring/web';
import { invariant } from 'src/shared/invariant';
import { VStack } from 'src/ui/ui-kit/VStack';
import { UIText } from 'src/ui/ui-kit/UIText';
import { useAddressNfts } from 'src/ui/shared/requests/addressNfts/useAddressNfts';
import { Button } from 'src/ui/ui-kit/Button';
import { MediaContent } from 'src/ui/ui-kit/MediaContent';
import { HStack } from 'src/ui/ui-kit/HStack';
import CheckIcon from 'jsx:src/ui/assets/check.svg';
import { UnstyledButton } from 'src/ui/ui-kit/UnstyledButton';
import { dnaServicePort, walletPort } from 'src/ui/shared/channels';
import { INTERNAL_ORIGIN } from 'src/background/constants';
import { CircleSpinner } from 'src/ui/ui-kit/CircleSpinner';
import { BackButton } from 'src/ui/components/BackButton';
import { getError } from 'src/shared/errors/getError';
import * as helpersStyles from '../../shared/styles.module.css';
import BackgroundImg1 from '../../assets/self-custodial.png';
import BackgroundImg2 from '../../assets/seek-alpha.png';
import BackgroundImg3 from '../../assets/dont-be-maxi.png';
import BackgroundImg4 from '../../assets/be-invested.png';
import BackgroundImg5 from '../../assets/its-all-on-chain.png';
import { DNA_COLLECTION_ID } from '../../shared/constants';
import type { Value } from './values';
import { VALUE_INDEX, VALUE_TEXTS } from './values';
import * as styles from './styles.module.css';

const IMAGES = [
  BackgroundImg1,
  BackgroundImg2,
  BackgroundImg3,
  BackgroundImg4,
  BackgroundImg5,
];

export function SelectDna() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const address = params.get('address');
  const value = params.get('value') as Value;
  invariant(address, 'address should exist in search params');
  invariant(value, 'value should exist in search params');

  const { value: nfts } = useAddressNfts(
    {
      address,
      currency: 'usd',
      collection_ids: [DNA_COLLECTION_ID],
      sorted_by: 'created_long_ago',
    },
    { cachePolicy: 'network-only', limit: 100 }
  );

  const [selectedDna, setSelectedDna] = useState<string | null>(null);
  const selectedDnaId = selectedDna || nfts?.[0]?.token_id;
  const dna = useMemo(() => {
    return nfts?.find((nft) => nft.token_id === selectedDnaId);
  }, [nfts, selectedDnaId]);

  const contentAppearStyle = useSpring({
    transform: nfts?.length ? 'transateX(0)' : 'translateX(500px)',
    config: {
      tension: 300,
      friction: 22,
    },
  });

  const {
    mutate: upgradeDna,
    isLoading,
    error,
  } = useMutation({
    mutationFn: async () => {
      if (!selectedDnaId) {
        return;
      }
      const actionId = uuidv4();
      const backgroundId = VALUE_INDEX[value] + 1;
      const signatureMessage = `Claim Extension Background #${backgroundId} for ${selectedDnaId}\n\n${actionId}`;
      const signature = await walletPort.request('openPersonalSign', {
        params: [signatureMessage, address, ''],
        context: { origin: INTERNAL_ORIGIN },
        id: payloadId(),
      });
      await dnaServicePort.request('claimPerk', {
        actionId,
        address,
        tokenId: selectedDnaId,
        backgroundId,
        signature,
      });
    },
    onSuccess: () => {
      navigate(
        `/upgrade-dna/waiting?address=${address}&value=${value}&token-id=${selectedDnaId}`
      );
    },
  });

  const showSelect = nfts && nfts.length > 1;
  // don't show User Rejected error
  const showError = error && getError(error).code !== 4001;

  return (
    <div className={helpersStyles.container} style={{ height: 600 }}>
      <img
        src={IMAGES[VALUE_INDEX[value]]}
        alt={value}
        className={styles.backgroundValueImage}
      />
      <UIText
        kind="small/accent"
        color="var(--always-white)"
        style={{ position: 'absolute', left: 20, bottom: 20 }}
      >
        {VALUE_TEXTS[value].title}
      </UIText>
      {isLoading ? (
        <VStack
          gap={40}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: '50%',
            bottom: 0,
            justifyItems: 'center',
            alignContent: 'center',
          }}
        >
          <CircleSpinner
            size="36px"
            color="#CDCED3"
            trackColor="var(--always-white)"
            trackWidth="12%"
          />
          <VStack
            gap={12}
            style={{ justifyItems: 'center', textAlign: 'center' }}
          >
            <UIText kind="headline/hero" color="var(--always-white)">
              Waiting for
              <br />
              confirmation
            </UIText>
            <UIText kind="body/accent" color="var(--always-white)">
              Confirm transaction in the extension
            </UIText>
          </VStack>
        </VStack>
      ) : showError ? (
        <VStack
          gap={40}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: '50%',
            bottom: 0,
            justifyItems: 'center',
            alignContent: 'center',
          }}
        >
          <UIText
            kind="headline/h2"
            color="var(--negative-500)"
            style={{
              padding: 32,
              borderRadius: 20,
              background: 'rgba(255, 255, 255, 0.70)',
              backdropFilter: 'blur(20px)',
              textAlign: 'center',
            }}
          >
            Backend is unavaliable
            <br />
            Please, try again later
          </UIText>
        </VStack>
      ) : null}
      <div style={{ position: 'absolute', top: 16, right: 16 }}>
        <animated.div style={contentAppearStyle}>
          <VStack
            gap={showSelect ? 28 : 48}
            style={{
              justifyItems: 'center',
              borderRadius: 16,
              background: 'rgba(255, 255, 255, 0.90)',
              backdropFilter: 'blur(20px)',
              padding: '64px 0 55px',
              width: 428,
              height: 568,
              position: 'relative',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: 12,
                left: 12,
                color: 'var(--always-black)',
              }}
            >
              <BackButton
                onClick={() => navigate(-1)}
                style={{
                  ['--button-background-hover' as string]: '#e6e7e9',
                }}
              />
            </div>
            {dna ? (
              <>
                <VStack gap={8} style={{ justifyItems: 'center' }}>
                  <UIText
                    kind="headline/h2"
                    color="var(--always-black)"
                    style={{ textAlign: 'center' }}
                  >
                    Update your DNA
                    <br />
                    with a new background
                  </UIText>
                  {showSelect ? (
                    <UIText kind="small/accent" color="var(--always-black)">
                      One DNA per wallet only.
                    </UIText>
                  ) : null}
                </VStack>
                <VStack gap={16} style={{ justifyItems: 'center' }}>
                  <MediaContent
                    content={dna.metadata.content}
                    alt={`${dna.metadata.name} content`}
                    style={{
                      display: 'block',
                      maxHeight: showSelect ? 180 : 250,
                      minHeight: showSelect ? 180 : 250,
                      objectFit: 'cover',
                      boxShadow: '0px 8px 16px 0px rgba(0, 0, 0, 0.12)',
                      borderRadius: showSelect ? 16 : 22,
                    }}
                    errorStyle={{
                      width: showSelect ? 180 : 250,
                      height: showSelect ? 180 : 250,
                    }}
                  />
                  {showSelect ? (
                    <div
                      style={{
                        paddingInline: 8,
                        width: '100%',
                        display: 'flex',
                        justifyContent: nfts.length > 5 ? 'start' : 'center',
                        overflowX: nfts.length > 5 ? 'auto' : undefined,
                      }}
                    >
                      <HStack gap={16} style={{ flexShrink: 0 }}>
                        {nfts.map((nft) => {
                          const selected = selectedDnaId === nft.token_id;
                          return (
                            <UnstyledButton
                              className={styles.dnaButton}
                              key={nft.token_id}
                              onClick={() => setSelectedDna(nft.token_id)}
                            >
                              <VStack
                                gap={8}
                                style={{ justifyItems: 'center' }}
                              >
                                <div
                                  style={{
                                    width: 40,
                                    height: 40,
                                    position: 'relative',
                                  }}
                                >
                                  {selected ? (
                                    <>
                                      <div
                                        style={{
                                          borderRadius: 8,
                                          border:
                                            '2px solid var(--always-white)',
                                          background: 'rgba(0, 0,0, 0.2)',
                                          position: 'absolute',
                                          top: 2,
                                          left: 2,
                                          width: 36,
                                          height: 36,
                                        }}
                                      />
                                      <CheckIcon
                                        style={{
                                          width: 24,
                                          height: 24,
                                          position: 'absolute',
                                          top: 8,
                                          left: 8,
                                          color: 'var(--always-white)',
                                        }}
                                      />
                                    </>
                                  ) : null}
                                  <MediaContent
                                    content={nft.metadata.content}
                                    alt={`${nft.metadata.name} content`}
                                    style={{
                                      display: 'block',
                                      maxHeight: 40,
                                      minHeight: 40,
                                      objectFit: 'cover',
                                      borderRadius: 10,
                                      border: selected
                                        ? '2px solid var(--always-black)'
                                        : undefined,
                                    }}
                                    errorStyle={{
                                      width: 40,
                                      height: 40,
                                    }}
                                    forcePreview={true}
                                  />
                                </div>
                                <UIText
                                  kind="caption/accent"
                                  color={selected ? '#212227' : '#9C9FA8'}
                                >
                                  #{nft.token_id}
                                </UIText>
                              </VStack>
                            </UnstyledButton>
                          );
                        })}
                      </HStack>
                    </div>
                  ) : null}
                </VStack>
                <Button
                  kind="primary"
                  size={48}
                  style={{
                    justifySelf: 'center',
                    paddingInline: 16,
                    ['--button-background' as string]: 'var(--always-black)',
                    ['--button-background-hover' as string]: '#44444e',
                    ['--button-text' as string]: 'var(--always-white)',
                  }}
                  disabled={!selectedDnaId}
                  onClick={() => upgradeDna()}
                >
                  Update DNA
                </Button>
              </>
            ) : null}
          </VStack>
        </animated.div>
      </div>
    </div>
  );
}
