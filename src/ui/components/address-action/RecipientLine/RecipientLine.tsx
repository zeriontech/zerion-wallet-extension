import React, { useMemo } from 'react';
import { BlockieImg } from 'src/ui/components/BlockieImg';
import { truncateAddress } from 'src/ui/shared/truncateAddress';
import { Media } from 'src/ui/ui-kit/Media';
import { Surface } from 'src/ui/ui-kit/Surface';
import { TextAnchor } from 'src/ui/ui-kit/TextAnchor';
import { UIText } from 'src/ui/ui-kit/UIText';
import { openInNewWindow } from 'src/ui/shared/openInNewWindow';
import { toChecksumAddress } from 'src/modules/ethereum/toChecksumAddress';
import type { NetworkConfig } from 'src/modules/networks/NetworkConfig';
import { Networks } from 'src/modules/networks/Networks';
import { NetworkIcon } from '../../NetworkIcon';

export function RecipientLine({
  recipientAddress,
  recipientName,
  network,
  showNetworkIcon,
}: {
  recipientAddress: string;
  recipientName: string | null;
  network: NetworkConfig;
  showNetworkIcon: boolean;
}) {
  const checksumAddress = useMemo(
    () => toChecksumAddress(recipientAddress),
    [recipientAddress]
  );

  const showRecipientName = recipientName && recipientName !== recipientAddress;

  return (
    <Surface style={{ borderRadius: 8, padding: '10px 12px' }}>
      <Media
        image={
          <div style={{ position: 'relative', overflow: 'hidden' }}>
            <BlockieImg address={checksumAddress} size={36} borderRadius={8} />
            {showNetworkIcon ? (
              <div style={{ position: 'absolute', bottom: -2, right: -2 }}>
                <NetworkIcon
                  size={20}
                  name={network?.name || null}
                  src={network?.icon_url || ''}
                  style={{
                    borderRadius: 8,
                    border: '2px solid var(--neutral-100)',
                  }}
                />
              </div>
            ) : null}
          </div>
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
              href={Networks.getExplorerAddressUrl(network, checksumAddress)}
              target="_blank"
              rel="noopener noreferrer"
            >
              {showRecipientName
                ? recipientName
                : truncateAddress(checksumAddress, 15)}
            </TextAnchor>
          </UIText>
        }
      />
    </Surface>
  );
}
