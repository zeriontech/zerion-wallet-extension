import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { invariant } from 'src/shared/invariant';
import { UIText } from 'src/ui/ui-kit/UIText';
import { VStack } from 'src/ui/ui-kit/VStack';
import { CircleSpinner } from 'src/ui/ui-kit/CircleSpinner';
import { getAddressNftPosition } from 'src/ui/pages/NonFungibleToken/useAddressNftPosition';
import { NetworkId } from 'src/modules/networks/NetworkId';
import { useRenderDelay } from 'src/ui/components/DelayedRender/DelayedRender';
import * as helpersStyles from '../../shared/styles.module.css';
import { DNA_NFT_COLLECTION_ADDRESS } from '../../shared/constants';
import type { Value } from './values';
import { VALUE_IMAGE_URLS, VALUE_INDEX, VALUE_TEXTS } from './values';
import * as styles from './styles.module.css';

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

  const showDeadlingTitle = useRenderDelay(5000);

  return (
    <div className={helpersStyles.container} style={{ height: 600 }}>
      <img
        src={VALUE_IMAGE_URLS[VALUE_INDEX[value]]}
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
        <UIText
          kind="body/accent"
          color="var(--always-white)"
          style={{ textAlign: 'center' }}
        >
          {showDeadlingTitle
            ? 'Onchain magic can take around 30 seconds'
            : 'DNA sequencing in progress'}
        </UIText>
      </VStack>
    </div>
  );
}
