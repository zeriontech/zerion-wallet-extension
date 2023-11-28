import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { invariant } from 'src/shared/invariant';
import { UIText } from 'src/ui/ui-kit/UIText';
import { VStack } from 'src/ui/ui-kit/VStack';
import { CircleSpinner } from 'src/ui/ui-kit/CircleSpinner';
import { getAddressNftPosition } from 'src/ui/pages/NonFungibleToken/useAddressNftPosition';
import { NetworkId } from 'src/modules/networks/NetworkId';
import { DelayedRender } from 'src/ui/components/DelayedRender';
import BackgroundImg1 from '../../assets/self-custodial.png';
import BackgroundImg2 from '../../assets/seek-alpha.png';
import BackgroundImg3 from '../../assets/dont-be-maxi.png';
import BackgroundImg4 from '../../assets/be-invested.png';
import BackgroundImg5 from '../../assets/its-all-on-chain.png';
import * as helpersStyles from '../../shared/styles.module.css';
import { DNA_NFT_COLLECTION_ADDRESS } from '../../shared/constants';
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

export function UpgradeDnaWaiting() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const address = params.get('address');
  const value = params.get('value') as Value;
  const tokenId = params.get('token-id');
  invariant(address, 'address should exist in search params');
  invariant(value, 'value should exist in search params');
  invariant(tokenId, 'token id should exist in search params');

  const { data } = useQuery({
    queryKey: ['getAddressNftPosition', address, tokenId],
    queryFn: async () => {
      const data = await getAddressNftPosition({
        address,
        currency: 'usd',
        token_id: tokenId,
        contract_address: DNA_NFT_COLLECTION_ADDRESS,
        chain: NetworkId.Ethereum,
      });
      const dna = data.data?.['nft-position'];
      return dna || null;
    },
    suspense: false,
    refetchInterval: 3000,
  });

  useEffect(() => {
    if (
      data?.metadata.attributes.some(
        (attribute) =>
          attribute.key === 'Background' &&
          attribute.value === VALUE_TEXTS[value].title
      )
    ) {
      navigate(
        `/upgrade-dna/success?address=${address}&value=${value}&token-id=${data.token_id}`
      );
    }
  }, [data, address, navigate, value]);

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
      <VStack
        gap={16}
        style={{
          justifyItems: 'center',
          alignContent: 'center',
          zIndex: 2,
        }}
      >
        <CircleSpinner
          size="36px"
          color="#CDCED3"
          trackColor="var(--always-white)"
          trackWidth="12%"
        />
        <UIText
          kind="headline/hero"
          color="var(--always-white)"
          style={{ textAlign: 'center' }}
        >
          Applying New Background
        </UIText>
        <DelayedRender delay={5000}>
          <UIText
            kind="body/accent"
            color="var(--always-white)"
            style={{ textAlign: 'center' }}
          >
            It can take around 30 sec
          </UIText>
        </DelayedRender>
      </VStack>
    </div>
  );
}
