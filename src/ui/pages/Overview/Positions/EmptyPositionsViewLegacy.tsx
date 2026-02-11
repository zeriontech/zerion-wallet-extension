import React from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { normalizeAddress } from 'src/shared/normalizeAddress';
import { getAddressType } from 'src/shared/wallet/classifiers';
import { usePreferences } from 'src/ui/features/preferences';
import { walletPort } from 'src/ui/shared/channels';
import { setCurrentAddress } from 'src/ui/shared/requests/setCurrentAddress';
import { useWalletParams } from 'src/ui/shared/requests/useWalletParams';
import { Button } from 'src/ui/ui-kit/Button';
import { UIText } from 'src/ui/ui-kit/UIText';
import { UnstyledAnchor } from 'src/ui/ui-kit/UnstyledAnchor';
import { UnstyledLink } from 'src/ui/ui-kit/UnstyledLink';
import { VStack } from 'src/ui/ui-kit/VStack';

const ZERION_ORIGIN = 'https://app.zerion.io';

export function EmptyPositionsViewLegacy() {
  const { data: wallet } = useQuery({
    queryKey: ['wallet/uiGetCurrentWallet'],
    queryFn: () => {
      return walletPort.request('uiGetCurrentWallet');
    },
  });

  const { data: walletGroups, isLoading } = useQuery({
    queryKey: ['wallet/uiGetWalletGroups'],
    queryFn: () => walletPort.request('uiGetWalletGroups'),
    useErrorBoundary: true,
    suspense: false,
  });

  const { preferences } = usePreferences();
  const addWalletParams = useWalletParams(wallet);
  const navigate = useNavigate();

  const isTestnetMode = preferences?.testnetMode?.on;

  const goToBridgeMutation = useMutation({
    mutationFn: async () => {
      const solanaAddress = wallet?.address;
      let ethereumAddress: string | null = null;
      if (walletGroups) {
        for (const group of walletGroups) {
          for (const wallet of group.walletContainer.wallets) {
            const address = normalizeAddress(wallet.address);
            if (getAddressType(address) === 'evm') {
              ethereumAddress = address;
              break;
            }
          }
        }
      }
      if (ethereumAddress) {
        await setCurrentAddress({ address: ethereumAddress });
      }
      return { ethereumAddress, solanaAddress };
    },
    onSuccess: ({ ethereumAddress, solanaAddress }) => {
      if (!ethereumAddress || !solanaAddress) {
        navigate('/bridge-form');
      } else {
        const params = new URLSearchParams({
          outputChain: 'solana',
          showReceiverAddressInput: 'on',
          receiverAddressInput: solanaAddress,
          to: solanaAddress,
        });
        navigate(`/bridge-form?${params.toString()}`);
      }
    },
  });

  if (isTestnetMode || !wallet || goToBridgeMutation.isLoading || isLoading) {
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
    <VStack
      gap={16}
      style={{
        justifyItems: 'stretch',
        paddingInline: 16,
        textAlign: 'center',
        paddingBottom: 48,
      }}
    >
      <VStack gap={12} style={{ justifyItems: 'center' }}>
        <img
          alt="Empty Wallet Cover"
          src="https://cdn.zerion.io/images/dna-assets/empty-wallet-img.png"
          srcSet="https://cdn.zerion.io/images/dna-assets/empty-wallet-img.png, https://cdn.zerion.io/images/dna-assets/empty-wallet-img_2x.png 2x"
          style={{ height: 64 }}
        />
        <VStack gap={0}>
          <UIText kind="headline/h3">Fund your wallet</UIText>
          <UIText kind="body/regular" color="var(--neutral-600)">
            Buy or transfer crypto to get started
          </UIText>
        </VStack>
      </VStack>
      <VStack gap={8}>
        <Button
          size={48}
          kind="primary"
          as={UnstyledAnchor}
          href={`${ZERION_ORIGIN}/deposit?${addWalletParams}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          Buy Crypto with Card
        </Button>
        <Button
          size={44}
          kind="regular"
          as={UnstyledLink}
          to={`/receive?address=${wallet.address}`}
        >
          Receive from Another Wallet
        </Button>
        {getAddressType(wallet.address) === 'solana' ? (
          <Button
            kind="regular"
            size={44}
            onClick={() => goToBridgeMutation.mutate()}
          >
            Transfer from Ethereum
          </Button>
        ) : null}
      </VStack>
    </VStack>
  );
}
