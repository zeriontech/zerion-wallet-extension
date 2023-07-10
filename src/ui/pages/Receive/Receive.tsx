import React, { useCallback, useMemo } from 'react';
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
import { useSearchParams } from 'react-router-dom';
import { invariant } from 'src/shared/invariant';
import { useQuery } from '@tanstack/react-query';
import { lookupAddressName } from 'src/modules/name-service';
import { Spacer } from 'src/ui/ui-kit/Spacer';
import { WalletAvatar } from 'src/ui/components/WalletAvatar';

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

  const { data: domain } = useQuery({
    queryKey: ['name-service/lookupAddressName', address],
    queryFn: useCallback(() => lookupAddressName(address), [address]),
    suspense: false,
  });

  return (
    <Background backgroundKind="transparent">
      <PageColumn style={{ paddingTop: 40 }}>
        <NavigationTitle
          title="Receive"
          elementEnd={
            <WalletAvatar
              active={false}
              address={address}
              size={32}
              borderRadius={4}
            />
          }
        />
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
