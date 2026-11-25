import React from 'react';
import { BlockieImg } from 'src/ui/components/BlockieImg';
import { CopyableAddress } from 'src/ui/components/address-action/CopyableAddress';
import { toChecksumAddress } from 'src/modules/ethereum/toChecksumAddress';
import { truncateAddress } from 'src/ui/shared/truncateAddress';
import { Media } from 'src/ui/ui-kit/Media';
import { Surface } from 'src/ui/ui-kit/Surface';
import { UIText } from 'src/ui/ui-kit/UIText';

/**
 * A Safe transaction is attributed by the backend to the Safe, not to the
 * owner who signs it, so the preview's balance changes belong to another
 * account than the signing wallet.
 */
export function getPreviewAccount({
  signerAddress,
  actionAddress,
}: {
  signerAddress: string;
  actionAddress?: string | null;
}): { address: string; isOtherAccount: boolean } {
  if (actionAddress && actionAddress.toLowerCase() !== signerAddress.toLowerCase()) {
    return { address: actionAddress, isOtherAccount: true };
  }
  return { address: signerAddress, isOtherAccount: false };
}

export function PreviewAccountLine({
  signerAddress,
  actionAddress,
}: {
  signerAddress: string;
  actionAddress?: string | null;
}) {
  const { address, isOtherAccount } = getPreviewAccount({ signerAddress, actionAddress });
  if (!isOtherAccount) {
    return null;
  }
  const checksumAddress = toChecksumAddress(address);
  return (
    <Surface style={{ borderRadius: 8, padding: '10px 12px' }}>
      <Media
        image={<BlockieImg address={checksumAddress} size={36} borderRadius={8} />}
        vGap={0}
        text={
          <UIText kind="caption/regular" color="var(--neutral-500)">
            Balance changes shown for Safe
          </UIText>
        }
        detailText={
          <UIText kind="body/accent" color="var(--black)" title={checksumAddress}>
            <CopyableAddress address={checksumAddress}>
              {truncateAddress(checksumAddress, 4)}
            </CopyableAddress>
          </UIText>
        }
      />
    </Surface>
  );
}
