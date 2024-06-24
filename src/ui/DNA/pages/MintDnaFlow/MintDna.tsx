import React, { useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  animated,
  useChain,
  useSpring,
  useSpringRef,
  useTrail,
} from '@react-spring/web';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useAddressPositions } from 'defi-sdk';
import { payloadId } from '@walletconnect/jsonrpc-utils';
import type BigNumber from 'bignumber.js';
import { VStack } from 'src/ui/ui-kit/VStack';
import { UIText } from 'src/ui/ui-kit/UIText';
import { useTransactionFee } from 'src/ui/pages/SendTransaction/TransactionConfiguration/useTransactionFee';
import { createChain } from 'src/modules/networks/Chain';
import { NetworkId } from 'src/modules/networks/NetworkId';
import { HStack } from 'src/ui/ui-kit/HStack';
import { formatCurrencyValue } from 'src/shared/units/formatCurrencyValue';
import GlobeIcon from 'jsx:src/ui/assets/globe.svg';
import InfoIcon from 'jsx:src/ui/assets/info.svg';
import { UnstyledAnchor } from 'src/ui/ui-kit/UnstyledAnchor';
import { Button } from 'src/ui/ui-kit/Button';
import { TextAnchor } from 'src/ui/ui-kit/TextAnchor';
import { useWalletParams } from 'src/ui/shared/requests/useWalletParams';
import { walletPort } from 'src/ui/shared/channels';
import { CenteredDialog } from 'src/ui/ui-kit/ModalDialogs/CenteredDialog';
import { AddressDetails } from 'src/ui/pages/Receive/AddressDetails';
import type { HTMLDialogElementInterface } from 'src/ui/ui-kit/ModalDialogs/HTMLDialogElementInterface';
import { INTERNAL_ORIGIN } from 'src/background/constants';
import { invariant } from 'src/shared/invariant';
import { SidePanel } from 'src/ui/Onboarding/FAQ/SidePanel';
import { useGasPrices } from 'src/ui/shared/requests/useGasPrices';
import { useCurrency } from 'src/modules/currency/useCurrency';
import * as helpersStyles from '../../shared/styles.module.css';
import { Step } from '../../shared/Step';
import { DNA_MINT_CONTRACT_ADDRESS } from '../../shared/constants';
import * as styles from './styles.module.css';

const ZERION_ORIGIN = 'https://app.zerion.io';

function useDnaMintTransaction(address: string) {
  const mintTransaction = useMemo(
    () => ({
      chainId: 0x1,
      data: '0x1249c58b',
      gas: '0x186a0',
      to: DNA_MINT_CONTRACT_ADDRESS,
      from: address,
      value: '0x0',
    }),
    [address]
  );

  const chain = createChain(NetworkId.Ethereum);
  const { data: chainGasPrices = null } = useGasPrices(chain);
  const { costs } = useTransactionFee({
    address,
    transaction: mintTransaction,
    chain,
    chainGasPrices,
    networkFeeConfiguration: null,
    onFeeValueCommonReady: null,
  });
  const feeValueFiat = costs?.totalValueFiat;
  const { currency } = useCurrency();

  const { value, isLoading: positionsAreLoading } = useAddressPositions(
    {
      address,
      assets: ['eth'],
      currency,
    },
    { enabled: Boolean(address) }
  );

  const ethPosition = useMemo(() => {
    return value?.positions?.find(
      (item) => item.chain === NetworkId.Ethereum && item.type === 'asset'
    );
  }, [value]);

  const hasEnoughEth =
    Number(ethPosition?.value || 0) > Number(feeValueFiat || 0);

  return {
    mintTransaction,
    hasEnoughEth,
    feeValueFiat,
    isLoading: positionsAreLoading,
  };
}

function MintDnaContent({
  onMint,
  feeValueFiat,
  loading,
  waitingForConfirmation,
}: {
  onMint(): void;
  feeValueFiat?: BigNumber | null;
  loading: boolean;
  waitingForConfirmation: boolean;
}) {
  const { currency } = useCurrency();

  return (
    <VStack gap={32} style={{ justifyItems: 'center' }}>
      <VStack gap={12} style={{ justifyItems: 'center' }}>
        <UIText kind="headline/hero">
          {waitingForConfirmation
            ? 'Waiting for confirmation'
            : 'Zerion Dynamic NFT Avatar'}
        </UIText>
        <UIText kind="body/accent" color="var(--neutral-600)">
          {waitingForConfirmation
            ? 'Confirm transaction in the extension'
            : 'A first-of-its-kind, living and unique NFT that evolves with as you explore Web3.'}
        </UIText>
      </VStack>
      {waitingForConfirmation ? null : (
        <VStack gap={16} style={{ justifyItems: 'center' }}>
          <Button disabled={loading} onClick={onMint} size={48}>
            <UIText kind="body/accent">Mint Zerion DNA</UIText>
          </Button>
          {feeValueFiat ? (
            <HStack gap={8} alignItems="center">
              <UIText kind="caption/regular">Network Fee</UIText>
              <UIText kind="caption/accent">
                {formatCurrencyValue(feeValueFiat, 'en', currency)}
              </UIText>
            </HStack>
          ) : null}
        </VStack>
      )}
    </VStack>
  );
}

export function MintDna() {
  const [animation, setAnimation] = useState(true);
  const firstAppearRef = useSpringRef();
  const firstAppearStyle = useSpring({
    ref: firstAppearRef,
    from: { opacity: 0, y: 20, filter: 'blur(5px)' },
    to: { opacity: 1, y: 0, filter: 'blur(0px)' },
    config: {
      tension: 80,
      friction: 30,
    },
  });

  const secondAppearRef = useSpringRef();
  const secondAppearStyle = useSpring({
    ref: secondAppearRef,
    from: { transform: 'scale(1.6)', x: 20 },
    to: { transform: 'scale(1)', x: 0 },
    config: {
      tension: 140,
      friction: 30,
    },
  });

  const chainAppearRef = useSpringRef();
  const chainAppearStyle = useTrail(5, {
    ref: chainAppearRef,
    from: { opacity: 0, y: 20, filter: 'blur(2px)' },
    to: { opacity: 1, y: 0, filter: 'blur(0px)' },
    config: {
      tension: 250,
      friction: 30,
    },
  });

  const contentAppearRef = useSpringRef();
  const contentAppearStyle = useSpring({
    ref: contentAppearRef,
    from: { opacity: 0, y: -20 },
    to: { opacity: 1, y: 0 },
    config: {
      tension: 80,
      friction: 30,
    },
    onStart: () => setAnimation(false),
  });

  const helpersAppearRef = useSpringRef();
  const helpersAppearStyle = useSpring({
    ref: helpersAppearRef,
    from: { opacity: 0 },
    to: { opacity: 1 },
    config: {
      tension: 80,
      friction: 30,
    },
  });

  useChain(
    [
      firstAppearRef,
      secondAppearRef,
      chainAppearRef,
      contentAppearRef,
      helpersAppearRef,
    ],
    [0.2, 0.8, 1.1, 1.6, 1.8]
  );

  const [params] = useSearchParams();
  const address = params.get('address');
  invariant(address, 'address should exist in search params');
  const [showTopUpWalletPanel, setShowTopUpWalletPanel] = useState(false);
  const { mintTransaction, feeValueFiat, hasEnoughEth, isLoading } =
    useDnaMintTransaction(address);

  const { data: wallet } = useQuery({
    queryKey: ['wallet/uiGetCurrentWallet'],
    queryFn: () => {
      return walletPort.request('uiGetCurrentWallet');
    },
  });
  const addWalletParams = useWalletParams(wallet);
  const dialogRef = useRef<HTMLDialogElementInterface | null>(null);
  const navigate = useNavigate();

  const { mutate: sendTransaction, isLoading: isTransactionLoading } =
    useMutation({
      mutationFn: async () => {
        return walletPort.request('openSendTransaction', {
          params: [mintTransaction, { clientScope: 'Zerion DNA' }],
          context: { origin: INTERNAL_ORIGIN },
          id: payloadId(),
        });
      },
      onSuccess: () => {
        navigate(`minting?address=${address}`);
      },
    });

  return (
    <>
      <CenteredDialog ref={dialogRef} style={{ width: 425, height: 460 }}>
        <VStack gap={32} style={{ justifyItems: 'center' }}>
          <UIText kind="headline/h3">Wallet Details</UIText>
          <AddressDetails address={address} />
        </VStack>
      </CenteredDialog>
      <SidePanel
        show={showTopUpWalletPanel}
        onDismiss={() => setShowTopUpWalletPanel(false)}
      >
        <VStack gap={20}>
          <div className={styles.infoIcon}>
            <InfoIcon style={{ width: 24, height: 24 }} />
          </div>
          <VStack gap={16}>
            <UIText kind="body/accent">Top up your wallet</UIText>
            <UIText kind="body/regular">
              Our NFTs are completely{' '}
              <UIText kind="body/accent" inline={true}>
                free
              </UIText>
              , but you’ll need funds to cover network fees
            </UIText>
            <VStack gap={8}>
              <Button
                style={{ width: '100%' }}
                as={TextAnchor}
                href={`${ZERION_ORIGIN}/send?addressInputValue=${address}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Transfer ETH
              </Button>
              <Button
                style={{ width: '100%' }}
                kind="regular"
                as={TextAnchor}
                href={`${ZERION_ORIGIN}/deposit?${addWalletParams}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Buy ETH with cash
              </Button>
              <Button
                style={{ width: '100%' }}
                onClick={() => {
                  dialogRef.current?.showModal();
                }}
                kind="regular"
              >
                Show QR Code
              </Button>
            </VStack>
          </VStack>
        </VStack>
      </SidePanel>
      <div className={helpersStyles.container} style={{ height: 600 }}>
        <div style={{ position: 'absolute', bottom: -4, left: 128 }}>
          <animated.div style={chainAppearStyle[4]}>
            <img
              src="https://s3.amazonaws.com/cdn.zerion.io/images/dna-assets/dna-6.png"
              alt="dna image"
              style={{ objectFit: 'contain', width: 202 }}
            />
          </animated.div>
        </div>
        <div style={{ position: 'absolute', bottom: -4, left: 193 }}>
          <animated.div style={chainAppearStyle[3]}>
            <img
              src="https://s3.amazonaws.com/cdn.zerion.io/images/dna-assets/dna-5.png"
              alt="dna image"
              style={{ objectFit: 'contain', width: 220 }}
            />
          </animated.div>
        </div>
        <div style={{ position: 'absolute', bottom: -4, left: 250 }}>
          <animated.div style={chainAppearStyle[2]}>
            <img
              src="https://s3.amazonaws.com/cdn.zerion.io/images/dna-assets/dna-4.png"
              alt="dna image"
              style={{ width: 248, height: 264 }}
            />
          </animated.div>
        </div>
        <div style={{ position: 'absolute', bottom: -4, left: 330 }}>
          <animated.div style={chainAppearStyle[1]}>
            <img
              src="https://s3.amazonaws.com/cdn.zerion.io/images/dna-assets/dna-3.png"
              alt="dna image"
              style={{ objectFit: 'contain', width: 244 }}
            />
          </animated.div>
        </div>
        <div style={{ position: 'absolute', bottom: -4, left: 385 }}>
          <animated.div style={chainAppearStyle[0]}>
            <img
              src="https://s3.amazonaws.com/cdn.zerion.io/images/dna-assets/dna-2.png"
              alt="dna image"
              style={{ objectFit: 'contain', width: 273 }}
            />
          </animated.div>
        </div>
        <div style={{ position: 'absolute', bottom: -4, left: 480 }}>
          <animated.div style={firstAppearStyle}>
            <animated.div
              style={{
                ...secondAppearStyle,
                transformOrigin: '50% calc(100% - 4px)',
              }}
            >
              <img
                src="https://s3.amazonaws.com/cdn.zerion.io/images/dna-assets/dna-1.png"
                alt="dna image"
                style={{ objectFit: 'contain', width: 270 }}
              />
            </animated.div>
          </animated.div>
        </div>
        <animated.div style={contentAppearStyle}>
          <MintDnaContent
            onMint={() => {
              if (!hasEnoughEth) {
                setShowTopUpWalletPanel(true);
                return;
              }
              sendTransaction();
            }}
            feeValueFiat={feeValueFiat}
            loading={isLoading || animation}
            waitingForConfirmation={isTransactionLoading}
          />
        </animated.div>
        <animated.div style={helpersAppearStyle}>
          <HStack
            gap={4}
            className={helpersStyles.steps}
            justifyContent="center"
          >
            <Step active={!isTransactionLoading} />
            <Step active={isTransactionLoading} />
            <Step active={false} />
            <Step active={false} />
          </HStack>
          <UnstyledAnchor
            className={styles.siteLink}
            target="_blank"
            href="https://zerion.io/dna"
            title="Zerion DNA"
          >
            <GlobeIcon style={{ width: 24, height: 24 }} />
          </UnstyledAnchor>
        </animated.div>
      </div>
    </>
  );
}
