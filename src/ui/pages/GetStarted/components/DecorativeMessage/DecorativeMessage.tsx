import React from 'react';
import browser from 'webextension-polyfill';
import { HStack } from 'src/ui/ui-kit/HStack';
import { Surface } from 'src/ui/ui-kit/Surface';
import { UIText } from 'src/ui/ui-kit/UIText';
import { VStack } from 'src/ui/ui-kit/VStack';
import { BlockieImg } from 'src/ui/components/BlockieImg';
import { truncateAddress } from 'src/ui/shared/truncateAddress';

export function DecorativeMessage({
  text,
  isConsecutive = false,
}: {
  text: React.ReactNode;
  isConsecutive?: boolean;
}) {
  return (
    <HStack
      gap={8}
      alignItems="start"
      style={{
        gridTemplateColumns: 'minmax(min-content, max-content) auto',
      }}
    >
      <div
        style={{
          visibility: isConsecutive ? 'hidden' : undefined,
          borderRadius: '50%',
          padding: 4,
          border: '2px solid var(--white)',
          textAlign: 'center',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <img
          src={browser.runtime.getURL(
            require('src/ui/assets/zerion-logo-round@2x.png')
          )}
          style={{
            width: 32,
            height: 32,
          }}
        />
      </div>
      <Surface style={{ padding: 12, borderTopLeftRadius: 4 }}>{text}</Surface>
    </HStack>
  );
}

export function DecorativeMessageDone({
  address,
  messageKind = 'new',
}: {
  address: string;
  messageKind?: 'import' | 'new';
}) {
  return (
    <>
      <DecorativeMessage
        text={
          <UIText kind="h/6_med">
            All done!{' '}
            <span style={{ color: 'var(--primary)' }}>
              {messageKind === 'import'
                ? 'Your wallet has been imported 🚀'
                : 'Your wallet has been created 🚀'}
            </span>
          </UIText>
        }
      />
      <DecorativeMessage
        isConsecutive={true}
        text={
          <VStack gap={8}>
            <UIText kind="subtitle/m_reg">You can now use</UIText>
            <Surface
              style={{
                padding: 12,
                backgroundColor: 'var(--background)',
              }}
            >
              <HStack gap={12} alignItems="center">
                <BlockieImg address={address} size={44} />
                <div>
                  <UIText kind="subtitle/l_reg" title={address}>
                    {truncateAddress(address, 8)}
                  </UIText>
                </div>
              </HStack>
            </Surface>
          </VStack>
        }
      />
    </>
  );
}
