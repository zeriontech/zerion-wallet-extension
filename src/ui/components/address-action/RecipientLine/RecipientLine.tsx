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
import { NetworkIcon } from '../../NetworkIcon';

export function RecipientLine({
  recipientAddress,
  chain,
  networks,
  showNetworkIcon,
}: {
  recipientAddress: string;
  chain: Chain;
  networks: Networks;
  showNetworkIcon: boolean;
}) {
  const network = networks.getNetworkByName(chain) || null;

  const checksumAddress = useMemo(
    () => toChecksumAddress(recipientAddress),
    [recipientAddress]
  );
  return (
    <Surface style={{ borderRadius: 8, padding: '10px 12px' }}>
      <Media
        image={
          <div style={{ position: 'relative' }}>
            <BlockieImg address={checksumAddress} size={36} borderRadius={6} />
            {showNetworkIcon ? (
              <div style={{ position: 'absolute', bottom: 0, right: 0 }}>
                <NetworkIcon
                  size={16}
                  name={network?.name || null}
                  src={network?.icon_url || ''}
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
