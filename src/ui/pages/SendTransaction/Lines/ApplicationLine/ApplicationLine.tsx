import React, { useLayoutEffect, useState } from 'react';
import { animated, useTransition } from 'react-spring';
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
import { ShuffleText } from 'src/ui/components/ShuffleText';

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
            <ShuffleText text={name || address} />
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

const FadeOutAndIn = ({
  src,
  render,
}: React.PropsWithChildren<{
  src: string;
  render: (src: string) => React.ReactNode;
}>) => {
  const [currentSrc, setCurrentSrc] = useState(src);

  const transitions = useTransition(currentSrc, {
    from: {
      opacity: 0,
      transform: 'scale(0.98)',
    },
    enter: {
      opacity: 1,
      transform: 'scale(1)',
    },
    leave: {
      opacity: 0,
      transform: 'scale(0.98)',
    },
    exitBeforeEnter: true,
    config: {
      duration: 100,
    },
    initial: { from: { opacity: 1, transform: 'scale(1)' } },
  });

  useLayoutEffect(() => {
    setCurrentSrc(src);
  }, [src]);

  return transitions((styles, item) => {
    return <animated.div style={styles}>{render(item)}</animated.div>;
  });
};

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
            <FadeOutAndIn
              src={applicationIcon || ''}
              render={(src) => (
                <div
                  style={{
                    position: 'relative',
                    width: 36,
                    height: 36,
                  }}
                >
                  <Image
                    // safari doesn't emit img onError for empty string src
                    src={src || 'no-image'}
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

                  <div style={{ position: 'absolute', bottom: 0, right: 0 }}>
                    <NetworkIcon
                      size={16}
                      name={network?.name || null}
                      chainId={network?.external_id || null}
                      src={network?.icon_url || ''}
                    />
                  </div>
                </div>
              )}
            ></FadeOutAndIn>
          }
        />
      )}
    </Surface>
  );
}
