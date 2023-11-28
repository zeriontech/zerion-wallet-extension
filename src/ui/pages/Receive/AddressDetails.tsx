import React from 'react';
import { QRCode } from 'react-qrcode-logo';
import { Button } from 'src/ui/ui-kit/Button';
import { HStack } from 'src/ui/ui-kit/HStack';
import { Spacer } from 'src/ui/ui-kit/Spacer';
import { UIText } from 'src/ui/ui-kit/UIText';
import { VStack } from 'src/ui/ui-kit/VStack';
import CopyIcon from 'jsx:src/ui/assets/copy.svg';
import CheckIcon from 'jsx:src/ui/assets/check_double.svg';
import { useCopyToClipboard } from 'src/ui/shared/useCopyToClipboard';

export function AddressDetails({
  address,
  domain,
}: {
  address: string;
  domain?: string | null;
}) {
  const { handleCopy, isSuccess } = useCopyToClipboard({ text: address });

  return (
    <VStack gap={16} style={{ justifyItems: 'center' }}>
      <div
        style={{
          overflow: 'hidden',
          borderRadius: 20,
          width: 248,
          height: 248,
          border: '2px solid var(--neutral-200)',
        }}
      >
        <QRCode
          value={address}
          removeQrCodeBehindLogo={true}
          quietZone={24}
          qrStyle="dots"
          eyeRadius={2}
          size={200}
          logoImage="https://s3.amazonaws.com/cdn.zerion.io/assets/logo-icon-128.png"
          logoWidth={36}
          logoHeight={36}
          logoPadding={8}
        />
      </div>
      <VStack gap={8} style={{ justifyItems: 'center' }}>
        {domain ? (
          <UIText kind="headline/h3">{domain}</UIText>
        ) : (
          <Spacer height={24} />
        )}
        <UIText kind="small/regular">
          <b>{address.slice(0, 6)}</b>
          {address.slice(6, -4)}
          <b>{address.slice(-4)}</b>
        </UIText>
      </VStack>
      <Button
        kind="regular"
        size={36}
        style={{ padding: '4px 16px' }}
        onClick={handleCopy}
      >
        {isSuccess ? (
          <HStack gap={12} alignItems="center">
            <CheckIcon
              style={{
                display: 'block',
                width: 20,
                height: 20,
                color: 'var(--positive-500)',
              }}
            />
            <UIText kind="caption/accent">Copied</UIText>
          </HStack>
        ) : (
          <HStack gap={12} alignItems="center">
            <CopyIcon style={{ display: 'block', width: 20, height: 20 }} />
            <UIText kind="caption/accent">Copy Address</UIText>
          </HStack>
        )}
      </Button>
    </VStack>
  );
}
