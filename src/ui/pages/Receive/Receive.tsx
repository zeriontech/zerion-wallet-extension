import React, { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { QRCode } from 'react-qrcode-logo';
import { Background } from 'src/ui/components/Background';
import { useBodyStyle } from 'src/ui/components/Background/Background';
import { NavigationTitle } from 'src/ui/components/NavigationTitle';
import { PageColumn } from 'src/ui/components/PageColumn';
import { Button } from 'src/ui/ui-kit/Button';
import { HStack } from 'src/ui/ui-kit/HStack';
import { UIText } from 'src/ui/ui-kit/UIText';
import { VStack } from 'src/ui/ui-kit/VStack';
import CopyIcon from 'jsx:src/ui/assets/copy.svg';
import { useCopyToClipboard } from 'src/ui/shared/useCopyToClipboard';
import { invariant } from 'src/shared/invariant';

export function Receive() {
  const [params] = useSearchParams();
  const address = params.get('address');
  invariant(address, 'address param is required');
  const { handleCopy, isSuccess } = useCopyToClipboard({ text: address });

  useBodyStyle(
    useMemo(
      () => ({
        backgroundColor: 'var(--neutral-100)',
      }),
      []
    )
  );

  return (
    <Background backgroundKind="transparent">
      <PageColumn style={{ paddingTop: 40 }}>
        <NavigationTitle title="Receive" address={address} />
        <VStack gap={16} style={{ justifyItems: 'center' }}>
          <div
            style={{
              backgroundColor: 'var(--white)',
              borderRadius: 12,
              padding: '8px 26px',
              color: 'var(--neutral-600)',
              textAlign: 'center',
            }}
          >
            <UIText kind="small/regular">
              Assets can only be sent within
              <br />
              the same network
            </UIText>
          </div>
          <div
            style={{
              overflow: 'hidden',
              borderRadius: 12,
              width: 248,
              height: 248,
            }}
          >
            <QRCode
              value={address}
              removeQrCodeBehindLogo={true}
              quietZone={24}
              qrStyle="dots"
              eyeRadius={2}
              size={200}
              logoImage="https://protocol-icons.s3.amazonaws.com/zerion+defi+sdk.png"
            />
          </div>
          <VStack gap={8} style={{ justifyItems: 'center' }}>
            {/* todo: add ens/lens support! */}
            {/* <UIText kind="headline/h3">test.zerion.eth</UIText> */}
            <HStack gap={0} alignItems="center">
              <UIText kind="small/accent">{address.slice(0, 6)}</UIText>
              <UIText kind="small/regular">{address.slice(6, -4)}</UIText>
              <UIText kind="small/accent">{address.slice(-4)}</UIText>
            </HStack>
          </VStack>
          <Button
            kind="regular"
            size={36}
            style={{ padding: '4px 16px' }}
            onClick={handleCopy}
          >
            {isSuccess ? (
              <HStack gap={12} alignItems="center">
                <div
                  style={{
                    width: 20,
                    height: 20,
                    color: 'var(--positive-500)',
                  }}
                >
                  ✔
                </div>
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
      </PageColumn>
    </Background>
  );
}
