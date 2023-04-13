import React from 'react';
import type { Asset } from 'defi-sdk';
import type { Chain } from 'src/modules/networks/Chain';
import type { Networks } from 'src/modules/networks/Networks';
import { AngleRightRow } from 'src/ui/components/AngleRightRow';
import { SurfaceList } from 'src/ui/ui-kit/SurfaceList';
import { Media } from 'src/ui/ui-kit/Media';
import { UIText } from 'src/ui/ui-kit/UIText';

export function TokenSymbolLine({
  asset,
  chain,
  networks,
}: {
  asset: Asset;
  chain: Chain;
  networks: Networks;
}) {
  const explorerTokenUrl = networks.getExplorerTokenUrlByName(
    chain,
    asset.asset_code
  );
  return (
    <SurfaceList
      items={[
        {
          key: 0,
          href: explorerTokenUrl,
          target: '_blank',
          rel: 'noopener noreferrer',
          component: (
            <AngleRightRow hideIcon={!explorerTokenUrl}>
              <Media
                vGap={0}
                image={
                  <img
                    style={{ width: 32, height: 32, borderRadius: '50%' }}
                    src={asset.icon_url || ''}
                  />
                }
                text={
                  <UIText kind="caption/regular" color="var(--neutral-500)">
                    Token
                  </UIText>
                }
                detailText={
                  <UIText kind="body/regular">{asset.symbol || '...'}</UIText>
                }
              />
            </AngleRightRow>
          ),
        },
      ]}
    />
  );
}
