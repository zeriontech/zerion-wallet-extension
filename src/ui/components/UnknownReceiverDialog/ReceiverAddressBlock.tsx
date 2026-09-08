import React from 'react';
import type { NetworkInfo } from 'src/modules/networks/NetworkInfo';
import { normalizeAddress } from 'src/shared/normalizeAddress';
import { BlockieImg } from 'src/ui/components/BlockieImg';
import { CopyButton } from 'src/ui/components/CopyButton';
import { FullAddress } from 'src/ui/components/FullAddress';
import { NetworkIcon } from 'src/ui/components/NetworkIcon';
import { useReceiverDisplayName } from 'src/ui/components/ReceiverAddressDialog';
import { Surface } from 'src/ui/ui-kit/Surface';
import { UIText } from 'src/ui/ui-kit/UIText';
import { VStack } from 'src/ui/ui-kit/VStack';

const AVATAR_SIZE = 36;
const AVATAR_RADIUS = 10;

/**
 * The receiver as shown inside the Unknown receiver confirmation. Deliberately
 * not `RecipientLine`: that one truncates the address to 15/15 characters,
 * which defeats the whole point of this dialog — the user is here to compare
 * the address against wherever they copied it from, so it is rendered in full
 * via {@link FullAddress}.
 */
export function ReceiverAddressBlock({
  address,
  network,
}: {
  address: string;
  network: NetworkInfo | null;
}) {
  const normalizedAddress = normalizeAddress(address);
  const display = useReceiverDisplayName(normalizedAddress);
  const name = display.addressBookName || display.walletName || display.handle;

  return (
    <Surface style={{ padding: 8 }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'auto minmax(0, 1fr) auto',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <div style={{ position: 'relative', flexShrink: 0 }}>
          {display.avatarUrl ? (
            <img
              src={display.avatarUrl}
              alt=""
              width={AVATAR_SIZE}
              height={AVATAR_SIZE}
              style={{
                width: AVATAR_SIZE,
                height: AVATAR_SIZE,
                borderRadius: AVATAR_RADIUS,
                objectFit: 'cover',
                display: 'block',
              }}
            />
          ) : (
            <BlockieImg
              address={normalizedAddress}
              size={AVATAR_SIZE}
              borderRadius={AVATAR_RADIUS}
            />
          )}
          {network ? (
            <div style={{ position: 'absolute', bottom: -2, right: -2 }}>
              <NetworkIcon
                size={20}
                name={network.name}
                src={network.iconUrl ?? ''}
                style={{
                  borderRadius: 8,
                  // Matches whatever the surrounding Surface is filled with,
                  // the way ApplicationLine does it.
                  border: '2px solid var(--surface-background-color)',
                }}
              />
            </div>
          ) : null}
        </div>
        <VStack gap={0} style={{ minWidth: 0 }}>
          <UIText kind="caption/regular" color="var(--neutral-500)">
            Recipient
          </UIText>
          {name ? (
            <UIText
              kind="body/accent"
              style={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {name}
            </UIText>
          ) : null}
          <FullAddress address={normalizedAddress} kind="small/regular" />
        </VStack>
        <CopyButton
          textToCopy={normalizedAddress}
          title="Copy address"
          tooltipContent={
            <UIText kind="caption/regular">Address copied</UIText>
          }
          tooltipPosition="center-bottom"
        />
      </div>
    </Surface>
  );
}
