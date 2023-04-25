import React from 'react';
import type { Networks } from 'src/modules/networks/Networks';
import type { Chain } from 'src/modules/networks/Chain';
import { BlockieImg } from 'src/ui/components/BlockieImg';
import { truncateAddress } from 'src/ui/shared/truncateAddress';
import { Media } from 'src/ui/ui-kit/Media';
import { Surface } from 'src/ui/ui-kit/Surface';
import { TextAnchor } from 'src/ui/ui-kit/TextAnchor';
import { UIText } from 'src/ui/ui-kit/UIText';

export function RecipientLine({
  recipientAddress,
  chain,
  networks,
}: {
  recipientAddress: string;
  chain: Chain;
  networks: Networks;
}) {
  return (
    <Surface style={{ borderRadius: 8, padding: '10px 12px' }}>
      <Media
        image={
          <BlockieImg address={recipientAddress} size={36} borderRadius={6} />
        }
        vGap={0}
        text={
          <UIText kind="caption/regular" color="var(--neutral-500)">
            Recipient
          </UIText>
        }
        detailText={
          <UIText
            kind="small/regular"
            color="var(--neutral-500)"
            title={recipientAddress}
          >
            <TextAnchor
              href={networks.getExplorerAddressUrlByName(
                chain,
                recipientAddress
              )}
              target="_blank"
              rel="noopener noreferrer"
            >
              {truncateAddress(recipientAddress, 4)}
            </TextAnchor>
          </UIText>
        }
      />
    </Surface>
  );
}
