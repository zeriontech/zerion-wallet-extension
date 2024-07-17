import { animated, useTransition } from '@react-spring/web';
import { capitalize } from 'capitalize-ts';
import React, { useLayoutEffect, useState } from 'react';
import ArrowLeftTop from 'jsx:src/ui/assets/arrow-left-top.svg';
import { toChecksumAddress } from 'src/modules/ethereum/toChecksumAddress';
import type { AnyAddressAction } from 'src/modules/ethereum/transactions/addressAction';
import type { Chain } from 'src/modules/networks/Chain';
import type { NetworkConfig } from 'src/modules/networks/NetworkConfig';
import type { Networks } from 'src/modules/networks/Networks';
import { BlockieImg } from 'src/ui/components/BlockieImg';
import { NetworkIcon } from 'src/ui/components/NetworkIcon';
import { ShuffleText } from 'src/ui/components/ShuffleText';
import { openInNewWindow } from 'src/ui/shared/openInNewWindow';
import { truncateAddress } from 'src/ui/shared/truncateAddress';
import { HStack } from 'src/ui/ui-kit/HStack';
import { Media } from 'src/ui/ui-kit/Media';
import { Image } from 'src/ui/ui-kit/MediaFallback';
import { Surface } from 'src/ui/ui-kit/Surface';
import { TextAnchor } from 'src/ui/ui-kit/TextAnchor';
import { UIText } from 'src/ui/ui-kit/UIText';

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

function ApplicationImage({
  action,
  network,
}: {
  action: Pick<AnyAddressAction, 'label'>;
  network: NetworkConfig | null;
}) {
  return (
    <FadeOutAndIn
      src={action.label?.icon_url || ''}
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
            style={{ width: '100%', display: 'block', borderRadius: 8 }}
            renderError={() => (
              <BlockieImg
                address={
                  action.label?.display_value.contract_address ||
                  action.label?.value ||
                  ''
                }
                size={36}
                borderRadius={8}
              />
            )}
          />

          <div style={{ position: 'absolute', bottom: 0, right: 0 }}>
            <NetworkIcon
              size={16}
              name={network?.name || null}
              src={network?.icon_url || ''}
              style={{ borderRadius: 4 }}
            />
          </div>
        </div>
      )}
    ></FadeOutAndIn>
  );
}

function getApplicationAddress(action: Pick<AnyAddressAction, 'label'>) {
  const contractAddress = action.label?.display_value.contract_address;
  if (contractAddress) {
    return contractAddress;
  }

  if (!action.label?.value) {
    return null;
  }

  try {
    return toChecksumAddress(action.label.value);
  } catch {
    return null;
  }
}

export function ApplicationLine({
  action,
  chain,
  networks,
}: {
  action: Pick<AnyAddressAction, 'label'>;
  chain: Chain;
  networks: Networks;
}) {
  const network = networks.getNetworkByName(chain) || null;

  // TODO: Remove this hacky fallback once we have backend support
  const applicationAddress = getApplicationAddress(action);

  return (
    <Surface style={{ borderRadius: 8, padding: '10px 12px' }}>
      <Media
        style={{ gridAutoColumns: 'minmax(min-content, max-content) auto' }}
        image={<ApplicationImage action={action} network={network} />}
        vGap={0}
        text={
          action.label?.type ? (
            <UIText kind="caption/regular" color="var(--neutral-500)">
              {capitalize(action.label.type)}
            </UIText>
          ) : null
        }
        detailText={
          <HStack gap={4} alignItems="center" justifyContent="space-between">
            <UIText kind="body/accent" color="var(--black)">
              <ShuffleText
                text={
                  action.label?.display_value.text ||
                  (applicationAddress
                    ? truncateAddress(applicationAddress, 4)
                    : '')
                }
              />
            </UIText>
            {applicationAddress ? (
              <UIText
                kind="small/regular"
                color="var(--neutral-500)"
                title={applicationAddress}
              >
                <TextAnchor
                  // Open URL in a new _window_ so that extension UI stays open and visible
                  onClick={openInNewWindow}
                  href={networks.getExplorerAddressUrlByName(
                    chain,
                    applicationAddress
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <HStack gap={3} justifyContent="center" alignItems="center">
                    <span>{truncateAddress(applicationAddress, 4)}</span>
                    <ArrowLeftTop />
                  </HStack>
                </TextAnchor>
              </UIText>
            ) : null}
          </HStack>
        }
      />
    </Surface>
  );
}
