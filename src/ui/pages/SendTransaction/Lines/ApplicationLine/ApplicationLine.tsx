import React from 'react';
import type { Chain } from 'src/modules/networks/Chain';
import type { Networks } from 'src/modules/networks/Networks';
import { DNA_MINT_CONTRACT_ADDRESS } from 'src/ui/components/DnaClaim/dnaAddress';
import { Media } from 'src/ui/ui-kit/Media';
import ZerionSquircle from 'jsx:src/ui/assets/zerion-squircle.svg';
import ArrowLeftTop from 'jsx:src/ui/assets/arrow-left-top.svg';
import { UIText } from 'src/ui/ui-kit/UIText';
import { Image } from 'src/ui/ui-kit/MediaFallback';
import { BlockieImg } from 'src/ui/components/BlockieImg';
import { HStack } from 'src/ui/ui-kit/HStack';
import { TextAnchor } from 'src/ui/ui-kit/TextAnchor';
import { truncateAddress } from 'src/ui/shared/truncateAddress';
import { Surface } from 'src/ui/ui-kit/Surface';
import { NetworkIcon } from 'src/ui/components/NetworkIcon';

function ApplicationLineContent({
  label,
  name,
  contractAddress,
  image,
  chain,
  networks,
}: {
  label: string;
  name?: string;
  contractAddress: string;
  image: React.ReactNode;
  chain: Chain;
  networks: Networks;
}) {
  const address = truncateAddress(contractAddress, 4);
  return (
    <Media
      style={{ gridAutoColumns: 'minmax(min-content, max-content) auto' }}
      image={image}
      vGap={0}
      text={
        <UIText kind="caption/regular" color="var(--neutral-500)">
          {label}
        </UIText>
      }
      detailText={
        <HStack gap={4} alignItems="center" justifyContent="space-between">
          <UIText kind="body/accent" color="var(--black)">
            {name || address}
          </UIText>
          <UIText
            kind="small/regular"
            color="var(--neutral-500)"
            title={contractAddress}
          >
            <TextAnchor
              href={networks.getExplorerAddressUrlByName(
                chain,
                contractAddress
              )}
              target="_blank"
              rel="noopener noreferrer"
            >
              <HStack gap={3} justifyContent="center" alignItems="center">
                <span>{address}</span>
                <ArrowLeftTop />
              </HStack>
            </TextAnchor>
          </UIText>
        </HStack>
      }
    />
  );
}

export function ApplicationLine({
  applicationName,
  applicationIcon,
  contractAddress,
  chain,
  networks,
}: {
  applicationName?: string;
  applicationIcon?: string;
  contractAddress: string;
  chain: Chain;
  networks: Networks;
}) {
  const network = networks.getNetworkByName(chain);

  return (
    <Surface style={{ borderRadius: 8, padding: '10px 12px' }}>
      {contractAddress === DNA_MINT_CONTRACT_ADDRESS ? (
        <ApplicationLineContent
          chain={chain}
          networks={networks}
          contractAddress={contractAddress}
          label="Zerion"
          name="mint DNA"
          image={<ZerionSquircle width={36} height={36} />}
        />
      ) : (
        <ApplicationLineContent
          chain={chain}
          networks={networks}
          contractAddress={contractAddress}
          label="Application"
          name={applicationName}
          image={
            <div
              style={{
                position: 'relative',
                width: 36,
                height: 36,
              }}
            >
              <div style={{ position: 'absolute', left: 0, top: 0 }}>
                <Image
                  // safari doesn't emit img onError for empty string src
                  src={applicationIcon || 'no-image'}
                  alt=""
                  style={{ width: '100%', display: 'block' }}
                  renderError={() => (
                    <BlockieImg
                      address={contractAddress}
                      size={36}
                      borderRadius={6}
                    />
                  )}
                />
              </div>
              <div style={{ position: 'absolute', bottom: 0, right: 0 }}>
                <NetworkIcon
                  size={16}
                  name={network?.name || null}
                  chainId={network?.external_id || null}
                  src={network?.icon_url || ''}
                />
              </div>
            </div>
          }
        />
      )}
    </Surface>
  );
}
