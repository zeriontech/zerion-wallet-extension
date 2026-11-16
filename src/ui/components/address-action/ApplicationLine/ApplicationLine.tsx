import { animated, useTransition } from '@react-spring/web';
import React, { useLayoutEffect, useState } from 'react';
import { toChecksumAddress } from 'src/modules/ethereum/toChecksumAddress';
import type { AnyAddressAction } from 'src/modules/ethereum/transactions/addressAction';
import type { NetworkInfo } from 'src/modules/networks/NetworkInfo';
import { BlockieImg } from 'src/ui/components/BlockieImg';
import { NetworkIcon } from 'src/ui/components/NetworkIcon';
import { ShuffleText } from 'src/ui/components/ShuffleText';
import { truncateAddress } from 'src/ui/shared/truncateAddress';
import { HStack } from 'src/ui/ui-kit/HStack';
import { Media } from 'src/ui/ui-kit/Media';
import { Image } from 'src/ui/ui-kit/MediaFallback';
import { Surface } from 'src/ui/ui-kit/Surface';
import { UIText } from 'src/ui/ui-kit/UIText';
import { CopyableAddress } from '../CopyableAddress';

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
  addressAction,
  network,
}: {
  addressAction: Pick<AnyAddressAction, 'label'>;
  network: NetworkInfo | null;
}) {
  return (
    <FadeOutAndIn
      src={addressAction.label?.contract?.dapp.iconUrl || ''}
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
                address={addressAction.label?.contract?.address || ''}
                size={36}
                borderRadius={8}
              />
            )}
          />

          <div
            style={{
              position: 'absolute',
              bottom: -2,
              right: -2,
            }}
          >
            <NetworkIcon
              size={20}
              name={network?.name || null}
              src={network?.iconUrl || ''}
              style={{
                borderRadius: 8,
                border: '2px solid var(--surface-background-color)',
              }}
            />
          </div>
        </div>
      )}
    />
  );
}

export function ApplicationLine({
  addressAction,
  network,
}: {
  addressAction: Pick<AnyAddressAction, 'label'>;
  network: NetworkInfo;
}) {
  const applicationAddress = addressAction.label?.contract?.address
    ? toChecksumAddress(addressAction.label.contract.address)
    : null;

  const name =
    addressAction.label?.contract?.dapp.name !== addressAction.label?.contract?.address
      ? addressAction.label?.contract?.dapp.name
      : null;

  return (
    <Surface style={{ borderRadius: 8, padding: '10px 12px' }}>
      <Media
        style={{ gridAutoColumns: 'minmax(min-content, max-content) auto' }}
        image={<ApplicationImage addressAction={addressAction} network={network} />}
        vGap={0}
        text={
          addressAction.label?.displayTitle ? (
            <UIText kind="caption/regular" color="var(--neutral-500)">
              {addressAction.label.displayTitle}
            </UIText>
          ) : null
        }
        detailText={
          <HStack gap={4} alignItems="center" justifyContent="space-between">
            <UIText kind="body/accent" color="var(--black)">
              <ShuffleText
                text={name || (applicationAddress ? truncateAddress(applicationAddress, 4) : '')}
              />
            </UIText>
            {applicationAddress ? (
              <UIText kind="small/regular" color="var(--neutral-500)" title={applicationAddress}>
                <CopyableAddress address={applicationAddress}>
                  {truncateAddress(applicationAddress, 4)}
                </CopyableAddress>
              </UIText>
            ) : null}
          </HStack>
        }
      />
    </Surface>
  );
}

export function ApplicationWalletLine({
  caption,
  address,
  network,
  onCopy,
}: {
  caption: string | null;
  address: string;
  network: NetworkInfo;
  onCopy: () => void;
}) {
  const checksumAddress = toChecksumAddress(address);
  const truncatedAddress = truncateAddress(checksumAddress, 4);

  return (
    <Surface style={{ borderRadius: 8, padding: '10px 12px' }}>
      <Media
        style={{ gridAutoColumns: 'minmax(min-content, max-content) auto' }}
        image={
          <div style={{ position: 'relative', width: 36, height: 36 }}>
            <BlockieImg address={checksumAddress} size={36} borderRadius={8} />
            <div style={{ position: 'absolute', bottom: -2, right: -2 }}>
              <NetworkIcon
                size={20}
                name={network?.name || null}
                src={network?.iconUrl || ''}
                style={{
                  borderRadius: 8,
                  border: '2px solid var(--surface-background-color)',
                }}
              />
            </div>
          </div>
        }
        vGap={0}
        text={
          caption ? (
            <UIText kind="caption/regular" color="var(--neutral-500)">
              {caption}
            </UIText>
          ) : null
        }
        detailText={
          <UIText kind="body/accent" color="var(--black)" title={checksumAddress}>
            <CopyableAddress address={checksumAddress} onCopy={onCopy}>
              {truncatedAddress}
            </CopyableAddress>
          </UIText>
        }
      />
    </Surface>
  );
}
