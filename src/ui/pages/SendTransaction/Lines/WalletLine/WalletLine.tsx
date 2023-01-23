import React from 'react';
import { Networks } from 'src/modules/networks/Networks';
import { Chain } from 'src/modules/networks/Chain';
import { truncateAddress } from 'src/ui/shared/truncateAddress';
import { WalletAvatar } from 'src/ui/components/WalletAvatar';
import { UIText } from 'src/ui/ui-kit/UIText';
import { TextAnchor } from 'src/ui/ui-kit/TextAnchor';
import { Media } from 'src/ui/ui-kit/Media';
import { ItemSurface } from '../../ItemSurface';

export function WalletLine({
  address,
  label,
  networks,
  chain,
}: {
  address: string;
  label: string;
  networks: Networks;
  chain: Chain;
}) {
  return (
    <ItemSurface>
      <Media
        vGap={0}
        image={<WalletAvatar address={address} size={32} borderRadius={4} />}
        text={
          <UIText kind="caption/reg" color="var(--neutral-500)">
            {label}
          </UIText>
        }
        detailText={
          <UIText kind="subtitle/l_reg">
            <TextAnchor
              href={networks.getExplorerAddressUrlByName(chain, address)}
              target="_blank"
              rel="noopener noreferrer"
            >
              {truncateAddress(address, 4)}
            </TextAnchor>
          </UIText>
        }
      />
    </ItemSurface>
  );
}
