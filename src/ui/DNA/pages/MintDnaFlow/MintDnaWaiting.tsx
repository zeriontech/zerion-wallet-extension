import React, { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { animated, useSpring } from '@react-spring/web';
import { HStack } from 'src/ui/ui-kit/HStack';
import { UnstyledAnchor } from 'src/ui/ui-kit/UnstyledAnchor';
import GlobeIcon from 'jsx:src/ui/assets/globe.svg';
import { VStack } from 'src/ui/ui-kit/VStack';
import { UIText } from 'src/ui/ui-kit/UIText';
import { CircleSpinner } from 'src/ui/ui-kit/CircleSpinner';
import { getAddressNfts } from 'src/ui/shared/requests/addressNfts/useAddressNfts';
import { invariant } from 'src/shared/invariant';
import * as helpersStyles from '../../shared/styles.module.css';
import { DNA_COLLECTION_ID } from '../../shared/constants';
import { Step } from '../../shared/Step';
import * as styles from './styles.module.css';

export function MintDnaWaiting() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const address = params.get('address');
  invariant(address, 'address should exist in search params');
  const { data } = useQuery({
    queryKey: ['getAddressNfts', address],
    queryFn: async () => {
      const data = await getAddressNfts({
        address,
        currency: 'usd',
        collection_ids: [DNA_COLLECTION_ID],
        sorted_by: 'created_recently',
      });
      const dna = data?.data?.['nft-positions'][0];
      return dna || null;
    },
    suspense: false,
    refetchInterval: (data) => (data ? false : 3000),
  });

  useEffect(() => {
    if (data) {
      navigate(
        `/mint-dna/success?address=${address}&token-id=${data.token_id}`
      );
    }
  }, [data, address, navigate]);

  const contentAppearStyle = useSpring({
    from: { opacity: 0, y: -20 },
    to: { opacity: 1, y: 0 },
    config: {
      tension: 80,
      friction: 30,
    },
  });

  return (
    <div className={helpersStyles.container} style={{ height: 600 }}>
      <img
        src="https://s3.amazonaws.com/cdn.zerion.io/images/dna-assets/minting-1.png"
        alt="minting"
        className={styles.mintingImage}
      />
      <img
        src="https://s3.amazonaws.com/cdn.zerion.io/images/dna-assets/minting-2.png"
        alt="minting"
        className={styles.mintingImage}
        style={{ animationDelay: '2000ms' }}
      />
      <img
        src="https://s3.amazonaws.com/cdn.zerion.io/images/dna-assets/minting-3.png"
        alt="minting"
        className={styles.mintingImage}
        style={{ animationDelay: '4000ms' }}
      />
      <img
        src="https://s3.amazonaws.com/cdn.zerion.io/images/dna-assets/minting-4.png"
        alt="minting"
        className={styles.mintingImage}
        style={{ animationDelay: '6000ms' }}
      />
      <animated.div style={contentAppearStyle}>
        <VStack gap={12} style={{ justifyItems: 'center' }}>
          <HStack gap={8} alignItems="center">
            <CircleSpinner
              size="36px"
              color="var(--neutral-400)"
              trackColor="var(--neutral-100)"
              trackWidth="12%"
            />
            <UIText kind="headline/hero">Transaction pending</UIText>
          </HStack>
          <UIText
            kind="body/accent"
            color="var(--neutral-600)"
            style={{ textAlign: 'center' }}
          >
            If the transaction takes more than 1 minute,
            <br />
            you can close this tab and continue later in the extension.
          </UIText>
        </VStack>
      </animated.div>
      <HStack gap={4} className={helpersStyles.steps} justifyContent="center">
        <Step active={false} />
        <Step active={true} />
        <Step active={false} />
        <Step active={false} />
      </HStack>
      <UnstyledAnchor
        className={styles.siteLink}
        target="_blank"
        href="https://zerion.io/dna"
      >
        <GlobeIcon style={{ width: 24, height: 24 }} />
      </UnstyledAnchor>
    </div>
  );
}
