import React, { useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import ArrowCircleIcon from 'jsx:src/ui/assets/arrow-circle-outlined.svg';
import { usePreferences } from 'src/ui/features/preferences';
import { walletPort } from 'src/ui/shared/channels';
import { Button } from 'src/ui/ui-kit/Button';
import { UIText } from 'src/ui/ui-kit/UIText';
import { VStack } from 'src/ui/ui-kit/VStack';
import { HStack } from 'src/ui/ui-kit/HStack';
import { type HTMLDialogElementInterface } from 'src/ui/ui-kit/ModalDialogs/HTMLDialogElementInterface';
import { emitter } from 'src/ui/shared/events';
import { useLocation } from 'react-router-dom';
import {
  ONRAMP_EXPERIMENT_NAME,
  useStatsigExperiment,
} from 'src/modules/statsig/statsig.client';
import { AddFundsOptionsDialog } from '../../Receive/AddFundsOptionsDialog';
import { EmptyPositionsViewLegacy } from './EmptyPositionsViewLegacy';

export function EmptyPositionsViewNew() {
  const { pathname } = useLocation();
  const { data: wallet } = useQuery({
    queryKey: ['wallet/uiGetCurrentWallet'],
    queryFn: () => {
      return walletPort.request('uiGetCurrentWallet');
    },
  });

  const { preferences } = usePreferences();
  const dialogRef = useRef<HTMLDialogElementInterface>(null);

  const isTestnetMode = preferences?.testnetMode?.on;

  if (isTestnetMode || !wallet) {
    return (
      <VStack gap={6} style={{ textAlign: 'center', padding: 20 }}>
        <UIText kind="headline/hero">🥺</UIText>
        <UIText kind="small/accent" color="var(--neutral-500)">
          No assets yet
        </UIText>
      </VStack>
    );
  }

  return (
    <>
      <VStack
        gap={16}
        style={{
          justifyItems: 'stretch',
          paddingInline: 16,
          textAlign: 'center',
          marginTop: 32,
          paddingBottom: 48,
        }}
      >
        <VStack gap={12} style={{ justifyItems: 'center' }}>
          <img
            alt=""
            src="https://cdn.zerion.io/images/dna-assets/empty-wallet-img.png"
            srcSet="https://cdn.zerion.io/images/dna-assets/empty-wallet-img.png, https://cdn.zerion.io/images/dna-assets/empty-wallet-img_2x.png 2x"
            style={{ height: 64 }}
          />
          <VStack gap={0}>
            <UIText kind="headline/h1">Get Started</UIText>
            <UIText kind="body/regular" color="var(--neutral-600)">
              By adding crypto to your wallet
            </UIText>
          </VStack>
        </VStack>
        <VStack gap={8}>
          <Button
            size={48}
            kind="primary"
            onClick={() => {
              emitter.emit('bannerClicked', {
                pathname,
                bannerName: 'Get started',
                walletAddress: wallet.address,
                bannerType: 'Fund_wallet',
                bannerSource: 'Internal',
              });
              dialogRef.current?.showModal();
            }}
          >
            <HStack gap={8} alignItems="center" justifyContent="center">
              <ArrowCircleIcon />
              <span>Fund</span>
            </HStack>
          </Button>
        </VStack>
      </VStack>
      <AddFundsOptionsDialog
        dialogRef={dialogRef}
        wallet={wallet}
        analytics={{ pathname, address: wallet.address }}
      />
    </>
  );
}

export function EmptyPositionsView() {
  const { data, isLoading } = useStatsigExperiment(ONRAMP_EXPERIMENT_NAME);
  if (isLoading) {
    return null;
  }
  if (data?.group_name?.toLowerCase() === 'test') {
    return <EmptyPositionsViewNew />;
  } else {
    return <EmptyPositionsViewLegacy />;
  }
}
