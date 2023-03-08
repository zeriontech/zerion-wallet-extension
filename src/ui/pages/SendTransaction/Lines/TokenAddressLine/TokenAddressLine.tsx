import React from 'react';
import { truncateAddress } from 'src/ui/shared/truncateAddress';
import { Networks } from 'src/modules/networks/Networks';
import { Chain } from 'src/modules/networks/Chain';
import { HStack } from 'src/ui/ui-kit/HStack';
import { SurfaceList } from 'src/ui/ui-kit/SurfaceList';
import { UIText } from 'src/ui/ui-kit/UIText';
import { Media } from 'src/ui/ui-kit/Media';
import { TextAnchor } from 'src/ui/ui-kit/TextAnchor';
import { CopyButton } from 'src/ui/components/CopyButton';

export function TokenAddressLine({
  address,
  chain,
  networks,
}: {
  address: string;
  networks: Networks;
  chain: Chain;
}) {
  return (
    <SurfaceList
      items={[
        {
          key: 0,
          component: (
            <Media
              vGap={0}
              image={null}
              text={
                <UIText kind="caption/regular" color="var(--neutral-500)">
                  Token
                </UIText>
              }
              detailText={
                <HStack gap={4} alignItems="center">
                  <UIText kind="small/regular" title={address}>
                    <TextAnchor
                      href={networks.getExplorerTokenUrlByName(chain, address)}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {truncateAddress(address, 6)}
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
