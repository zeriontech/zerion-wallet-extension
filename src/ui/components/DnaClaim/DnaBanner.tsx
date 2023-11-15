import React, { useMemo } from 'react';
import { useAddressNftContracts } from 'src/ui/shared/requests/useAddresNftContracts';
import { HStack } from 'src/ui/ui-kit/HStack';
import { VStack } from 'src/ui/ui-kit/VStack';
import { UIText } from 'src/ui/ui-kit/UIText';
import { UnstyledLink } from 'src/ui/ui-kit/UnstyledLink';
import { useLocalAddressTransactions } from 'src/ui/transactions/useLocalAddressTransactions';
import { normalizeAddress } from 'src/shared/normalizeAddress';

export const DNA_NFT_COLLECTION_ADDRESS =
  '0x932261f9fc8da46c4a22e31b45c4de60623848bf';

export function useShowDNABanner(address: string) {
  const { value } = useAddressNftContracts({
    address,
    currency: 'usd',
    sorted_by: 'amount_high',
  });

  const localTransactions = useLocalAddressTransactions({ address });

  return useMemo(
    () =>
      value &&
      !value.some(
        (item) => normalizeAddress(item.address) === DNA_NFT_COLLECTION_ADDRESS
      ) &&
      !localTransactions.some(
        (item) =>
          normalizeAddress(item.transaction.to || '') ===
          DNA_NFT_COLLECTION_ADDRESS
      ),
    [value, localTransactions]
  );
}

export function DnaNFTBanner({ style }: { style?: React.CSSProperties }) {
  return (
    <UnstyledLink
      to="/dna-claim"
      style={{ width: '100%', position: 'relative', ...style }}
    >
      <div
        style={{
          textAlign: 'left',
          position: 'relative',
          borderRadius: 16,
          paddingRight: 16,
          backgroundImage: `url(${require('./banner.png')})`,
          height: 72,
        }}
      >
        <HStack gap={12} justifyContent="space-between">
          <VStack
            gap={4}
            style={{
              justifyContent: 'start',
              padding: '12px 0 12px 16px',
              whiteSpace: 'nowrap',
            }}
          >
            <VStack gap={0}>
              <UIText kind="headline/h3" color="var(--always-black)">
                You look rare!
              </UIText>
              <UIText kind="headline/h3" color="var(--always-primary)">
                Mint your Zerion DNA
              </UIText>
            </VStack>
          </VStack>
          <HStack
            gap={4}
            style={{
              overflow: 'hidden',
              height: 72,
              alignContent: 'center',
            }}
          >
            <img
              style={{
                display: 'block',
                width: 80,
                height: 90,
                objectFit: 'cover',
              }}
              src={require('./dna.png')}
              srcSet={`${require('./dna.png')}, ${require('./dna_2x.png')} 2x`}
              alt=""
            />
          </HStack>
        </HStack>
      </div>
    </UnstyledLink>
  );
}
