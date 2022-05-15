import React from 'react';
import browser from 'webextension-polyfill';
import { useSearchParams } from 'react-router-dom';
import { PageColumn } from 'src/ui/components/PageColumn';
import { PageTop } from 'src/ui/components/PageTop';
import { walletPort, windowPort } from 'src/ui/shared/channels';
import { Spacer } from 'src/ui/ui-kit/Spacer';
import { UIText } from 'src/ui/ui-kit/UIText';
import { VStack } from 'src/ui/ui-kit/VStack';
import { Button } from 'src/ui/ui-kit/Button';
import { UnstyledButton } from 'src/ui/ui-kit/UnstyledButton';
import { useQuery } from 'react-query';
import { NetworkIndicator } from 'src/ui/components/NetworkIndicator';

export function SwitchEthereumChain() {
  const [params] = useSearchParams();
  const {
    data: wallet,
    isLoading,
    isError,
  } = useQuery('wallet', () => {
    return walletPort.request('getCurrentWallet');
  });
  if (isError) {
    return <p>Some Error</p>;
  }
  if (isLoading || !wallet) {
    return null;
  }
  const origin = params.get('origin');
  if (!origin) {
    throw new Error('origin get-parameter is required for this view');
  }
  const originName = new URL(origin).hostname;
  const chainId = params.get('chainId');

  return (
    <PageColumn>
      <PageTop />
      <div style={{ display: 'grid', placeItems: 'center' }}>
        <img
          style={{ width: 44, height: 44 }}
          src={browser.runtime.getURL(
            require('src/ui/assets/zerion-logo-round@2x.png')
          )}
        />
        <Spacer height={16} />
        <UIText kind="h/5_med" style={{ textAlign: 'center' }}>
          Switch Chain Request ({chainId})
        </UIText>
        <Spacer height={8} />
        <UIText kind="subtitle/m_reg" color="var(--primary)">
          {originName}
        </UIText>
        <Spacer height={8} />
        <NetworkIndicator />
      </div>
      <Spacer height={24} />
      <UIText kind="subtitle/m_reg" style={{ textAlign: 'center' }}>
        <i>Screen to be completed</i>
      </UIText>
      <Spacer height={16} />
      <Spacer height={16} />

      <VStack
        style={{ textAlign: 'center', marginTop: 'auto', paddingBottom: 32 }}
        gap={8}
      >
        <Button
          onClick={() => {
            windowPort.confirm(Number(params.get('windowId')));
          }}
        >
          Approve
        </Button>
        <UnstyledButton
          style={{ color: 'var(--primary)' }}
          onClick={() => {
            windowPort.reject(Number(params.get('windowId')));
          }}
        >
          Reject
        </UnstyledButton>
      </VStack>
    </PageColumn>
  );
}
