import React, { useMemo } from 'react';
import type { Networks } from 'src/modules/networks/Networks';
import type { Chain } from 'src/modules/networks/Chain';
import { BlockieImg } from 'src/ui/components/BlockieImg';
import { truncateAddress } from 'src/ui/shared/truncateAddress';
import { Media } from 'src/ui/ui-kit/Media';
import { Surface } from 'src/ui/ui-kit/Surface';
import { TextAnchor } from 'src/ui/ui-kit/TextAnchor';
import { UIText } from 'src/ui/ui-kit/UIText';
import { openInNewWindow } from 'src/ui/shared/openInNewWindow';
import { toChecksumAddress } from 'src/modules/ethereum/toChecksumAddress';

export function RecipientLine({
  recipientAddress,
  chain,
  networks,
}: {
  recipientAddress: string;
  chain: Chain;
  networks: Networks;
}) {
  const checksumAddress = useMemo(
    () => toChecksumAddress(recipientAddress),
    [recipientAddress]
  );
  return (
    <Surface style={{ borderRadius: 8, padding: '10px 12px' }}>
      <Media
        image={
          <BlockieImg address={checksumAddress} size={36} borderRadius={6} />
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
            title={checksumAddress}
          >
            <TextAnchor
              // Open URL in a new _window_ so that extension UI stays open and visible
              onClick={openInNewWindow}
              href={networks.getExplorerAddressUrlByName(
                chain,
                checksumAddress
              )}
              target="_blank"
              rel="noopener noreferrer"
            >
              {truncateAddress(checksumAddress, 15)}
            </TextAnchor>
          </UIText>
        }
      />
    </Surface>
  );
}
