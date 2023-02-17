import React from 'react';
import { Chain } from 'src/modules/networks/Chain';
import { Networks } from 'src/modules/networks/Networks';
import { truncateAddress } from 'src/ui/shared/truncateAddress';
import { HStack } from 'src/ui/ui-kit/HStack';
import { Media } from 'src/ui/ui-kit/Media';
import { SurfaceList } from 'src/ui/ui-kit/SurfaceList';
import { UIText } from 'src/ui/ui-kit/UIText';
import { TextAnchor } from 'src/ui/ui-kit/TextAnchor';
import { CopyButton } from 'src/ui/components/CopyButton';
import { BlockieImg } from 'src/ui/components/BlockieImg';

export function ContractAddressLine({
  address,
  chain,
  networks,
}: {
  address: string;
  chain: Chain;
  networks: Networks;
}) {
  return (
    <SurfaceList
      items={[
        {
          key: 0,
          target: '_blank',
          rel: 'noopener noreferrer',
          component: (
            <Media
              image={
                <BlockieImg address={address} size={36} borderRadius={6} />
              }
              vGap={0}
              text={
                <UIText kind="caption/reg" color="var(--neutral-500)">
                  Contract Address
                </UIText>
              }
              detailText={
                <HStack gap={4} alignItems="center">
                  <UIText kind="subtitle/m_reg" title={address}>
                    <TextAnchor
                      href={networks.getExplorerAddressUrlByName(
                        chain,
                        address
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {truncateAddress(address, 7)}
                    </TextAnchor>
                  </UIText>
                  <CopyButton address={address} />
                </HStack>
              }
            />
          ),
        },
      ]}
    />
  );
}
