import React from 'react';
import browser from 'webextension-polyfill';
import type { UnsignedTransaction } from 'ethers';
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
import { Surface } from 'src/ui/ui-kit/Surface';
import { BlockieImg } from 'src/ui/components/BlockieImg';
import { Media } from 'src/ui/ui-kit/Media';
import { truncateAddress } from 'src/ui/shared/truncateAddress';
import { NetworkIndicator } from 'src/ui/components/NetworkIndicator';

export function SendTransaction() {
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
  const transactionString = params.get('transaction');
  if (!transactionString) {
    throw new Error('transaction get-parameter is required for this view');
  }
  const transaction = JSON.parse(transactionString) as UnsignedTransaction;
  const originName = new URL(origin).hostname;
  const surfaceStyle = {
    padding: '10px 12px',
    backgroundColor: 'var(--background)',
  };
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
          Contract Interaction
        </UIText>
        <Spacer height={8} />
        <UIText kind="subtitle/m_reg" color="var(--primary)">
          {originName}
        </UIText>
        <Spacer height={8} />
        <NetworkIndicator chainId={transaction.chainId} />
      </div>
      <Spacer height={24} />
      <Spacer height={16} />
      <VStack gap={12}>
        <Surface style={surfaceStyle}>
          <Media
            vGap={0}
            image={<BlockieImg address={wallet.address} size={32} />}
            text={
              <UIText kind="caption/reg" color="var(--neutral-500)">
                Wallet
              </UIText>
            }
            detailText={
              <UIText kind="subtitle/l_reg">
                {truncateAddress(wallet.address, 4)}
              </UIText>
            }
          />
        </Surface>
        <Surface style={surfaceStyle}>
          <Media
            vGap={0}
            image={
              <img
                style={{ width: 32, height: 32, borderRadius: '50%' }}
                src="https://chain-icons.s3.amazonaws.com/ethereum.png"
              />
            }
            text={
              <UIText kind="caption/reg" color="var(--neutral-500)">
                Amount
              </UIText>
            }
            detailText={<UIText kind="subtitle/l_reg">0.7834 ETH</UIText>}
          />
        </Surface>
        <Surface style={surfaceStyle}>
          <Media
            image={null}
            text={
              <UIText kind="caption/reg" color="var(--neutral-500)">
                Contract Address
              </UIText>
            }
            detailText={
              <UIText
                kind="subtitle/l_reg"
                title="0x1111111111111111234erff23fsdfsdfsdf23r2dsf097d"
              >
                {truncateAddress(
                  '0x1111111111111111234erff23fsdfsdfsdf23r2dsf097d',
                  10
                )}
              </UIText>
            }
          />
        </Surface>
      </VStack>
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
