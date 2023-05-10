import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import cn from 'classnames';
import { useAddressPositions } from 'defi-sdk';
import { Button } from 'src/ui/ui-kit/Button';
import { HStack } from 'src/ui/ui-kit/HStack';
import { TextAnchor } from 'src/ui/ui-kit/TextAnchor';
import { UIText } from 'src/ui/ui-kit/UIText';
import { UnstyledButton } from 'src/ui/ui-kit/UnstyledButton';
import { VStack } from 'src/ui/ui-kit/VStack';
import { useAddressParams } from 'src/ui/shared/user-address/useAddressParams';
import { createChain } from 'src/modules/networks/Chain';
import { NetworkId } from 'src/modules/networks/NetworkId';
import { useTransactionFee } from 'src/ui/pages/SendTransaction/NetworkFee/NetworkFee';
import { formatCurrencyValue } from 'src/shared/units/formatCurrencyValue';
import { isTruthy } from 'is-truthy-ts';
import { CircleSpinner } from 'src/ui/ui-kit/CircleSpinner';
import { UnstyledLink } from 'src/ui/ui-kit/UnstyledLink';
import type { HTMLDialogElementInterface } from 'src/ui/ui-kit/ModalDialogs/HTMLDialogElementInterface';
import { BottomSheetDialog } from 'src/ui/ui-kit/ModalDialogs/BottomSheetDialog';
import { showConfirmDialog } from 'src/ui/ui-kit/ModalDialogs/showConfirmDialog';
import { DialogTitle } from 'src/ui/ui-kit/ModalDialogs/DialogTitle';
import { useQuery } from 'react-query';
import { walletPort } from 'src/ui/shared/channels';
import { useWalletParams } from 'src/ui/shared/requests/useWalletParams';
import { Background } from '../Background';
import { useBodyStyle } from '../Background/Background';
import { NavigationTitle } from '../NavigationTitle';
import { PageBottom } from '../PageBottom';
import { PageColumn } from '../PageColumn';
import * as styles from './styles.module.css';
import { DNA_MINT_CONTRACT_ADDRESS } from './dnaAddress';

function Step({
  paused,
  onClick,
  index,
  activeStep,
  ...props
}: {
  paused?: boolean;
  index: number;
  activeStep: number;
  onClick(): void;
} & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onClick'>) {
  const [key, setKey] = useState(0);

  const handleClick = useCallback(() => {
    onClick?.();
    setKey((current) => current + 1);
  }, [onClick]);

  return (
    <UnstyledButton
      className={styles.step}
      onClick={handleClick}
      aria-label={`Go to slide ${index + 1}`}
      {...props}
    >
      {activeStep >= index ? (
        <div
          key={key}
          className={cn(styles.stepProgress, {
            [styles.active]: activeStep === index,
            [styles.paused]: paused,
          })}
        />
      ) : null}
    </UnstyledButton>
  );
}

function useSteps({
  initial = 0,
  max = 1,
  interval = 3000,
}: {
  initial?: number;
  max?: number;
  interval?: number;
}) {
  const [step, setStep] = useState(initial % (max + 1));
  const [state, setState] = useState<'paused' | 'active'>('active');
  const intervalRef = useRef<NodeJS.Timer | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastStopTimeRef = useRef(Date.now());
  const remainingIntervalRef = useRef(interval);

  const updateStep = useCallback(
    (value?: number) => {
      lastStopTimeRef.current = Date.now();
      remainingIntervalRef.current = interval;
      setStep((current) => (value ?? current + 1) % (max + 1));
    },
    [max, interval]
  );

  const restartInterval = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    intervalRef.current = setInterval(updateStep, interval);
  }, [updateStep, interval]);

  useEffect(() => {
    restartInterval();
    const intervalId = intervalRef.current;

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [restartInterval]);

  const setStepManually = useCallback(
    (value: number) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      updateStep(value);
      restartInterval();
    },
    [restartInterval, updateStep]
  );

  const pause = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setState('paused');
    remainingIntervalRef.current =
      remainingIntervalRef.current - (Date.now() - lastStopTimeRef.current);
  }, []);

  const play = useCallback(() => {
    setState('active');
    timeoutRef.current = setTimeout(() => {
      updateStep();
      restartInterval();
    }, remainingIntervalRef.current);
    lastStopTimeRef.current = Date.now();
  }, [restartInterval, updateStep]);

  return { step, setStep: setStepManually, play, pause, state };
}

export function DnaPage() {
  const { step, setStep, state, play, pause } = useSteps({ max: 1 });
  const { singleAddress, params, ready } = useAddressParams();
  const dialogRef = useRef<HTMLDialogElementInterface | null>(null);

  const { data: wallet } = useQuery('wallet/uiGetCurrentWallet', () => {
    return walletPort.request('uiGetCurrentWallet');
  });
  const addWalletParams = useWalletParams(wallet);

  useBodyStyle(
    useMemo(
      () => ({
        background:
          'linear-gradient(180deg, var(--primary-200) 0%, var(--primary-100) 100%)',
      }),
      []
    )
  );

  const mintTransaction = useMemo(
    () => ({
      chainId: '0x1',
      data: '0x1249c58b',
      gas: 100_000,
      to: DNA_MINT_CONTRACT_ADDRESS,
      from: singleAddress,
      value: '0',
    }),
    [singleAddress]
  );

  const { isLoading, time, feeValueFiat } = useTransactionFee({
    transaction: mintTransaction,
    chain: createChain(NetworkId.Ethereum),
    onFeeValueCommonReady: () => null,
  });

  const { value, isLoading: positionsAreLoading } = useAddressPositions(
    {
      ...params,
      assets: ['eth'],
      currency: 'usd',
    },
    { enabled: ready }
  );

  const ethPosition = useMemo(() => {
    return value?.positions?.find(
      (item) => item.chain === NetworkId.Ethereum && item.type === 'asset'
    );
  }, [value]);

  const isEnoughEth =
    Number(ethPosition?.value || 0) > Number(feeValueFiat || 0);

  return (
    <Background backgroundKind="transparent">
      <BottomSheetDialog ref={dialogRef} height="330px">
        <DialogTitle title={null} />
        <VStack gap={24}>
          <VStack
            gap={8}
            style={{ justifyContent: 'center', textAlign: 'center' }}
          >
            <UIText kind="headline/h3">Top up your wallet</UIText>
            <UIText kind="body/regular">
              Our NFTs are completely{' '}
              <UIText kind="body/accent" style={{ display: 'inline' }}>
                free
              </UIText>
              , but you’ll need
              <br />
              funds to cover{' '}
              <TextAnchor
                href="https://help.zerion.io/en/articles/4057577-what-are-gas-fees"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: 'var(--primary)' }}
              >
                network fees
              </TextAnchor>
            </UIText>
          </VStack>
          <VStack gap={8}>
            <Button
              style={{ width: '100%' }}
              as={TextAnchor}
              href={`https://app.zerion.io/send/token?address=${singleAddress}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Transfer ETH
            </Button>
            <Button
              style={{ width: '100%' }}
              kind="regular"
              as={TextAnchor}
              href={`https://app.zerion.io/deposit?${addWalletParams}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Buy ETH with cash
            </Button>
            <Button
              style={{ width: '100%' }}
              as={UnstyledLink}
              to={`/receive?address=${singleAddress}`}
              kind="regular"
            >
              Show QR code
            </Button>
          </VStack>
        </VStack>
      </BottomSheetDialog>
      <PageColumn style={{ paddingTop: 18 }}>
        <NavigationTitle title="Claim Zerion DNA" />

        <VStack gap={24} style={{ width: '100%', justifyItems: 'center' }}>
          <div
            onMouseDown={pause}
            onMouseUp={play}
            style={{
              width: 328,
              height: 262,
              position: 'relative',
            }}
          >
            {step === 0 ? (
              <div
                style={{
                  width: '100%',
                  height: '135%',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  borderRadius: '50% 50% 0 0',
                  opacity: 0.3,
                  background:
                    'linear-gradient(180deg, var(--primary-300) 0%, rgba(0, 0, 0, 0) 60%)',
                }}
              />
            ) : null}
            <div
              style={{
                backgroundImage:
                  step === 0
                    ? `url(${require('./dnaPage1.png')})`
                    : `url(${require('./dnaPage2.png')})`,
                width: '100%',
                height: '100%',
                backgroundRepeat: 'no-repeat',
                backgroundSize: 'contain',
                backgroundPositionX: 'center',
                position: 'absolute',
                top: 0,
                left: 0,
              }}
            />
          </div>
          <VStack
            gap={8}
            style={{
              width: '100%',
              justifyItems: 'center',
              textAlign: 'center',
            }}
            onMouseDown={pause}
            onMouseUp={play}
          >
            {step === 0 ? (
              <>
                <HStack gap={4} alignItems="center">
                  <UIText kind="headline/h2">Your unique</UIText>
                  <UIText kind="headline/h2" color="var(--primary)">
                    on chain DNA
                  </UIText>
                </HStack>
                <UIText kind="body/regular">
                  Zerion DNA evolves as you
                  <br />
                  explore Web3
                </UIText>
              </>
            ) : (
              <>
                <HStack gap={4} alignItems="center">
                  <UIText kind="headline/h2">Level up</UIText>
                  <UIText kind="headline/h2" color="var(--primary)">
                    with every trade
                  </UIText>
                </HStack>
                <UIText kind="body/regular">
                  Watch your DNA change with every wallet
                  <br />
                  action!{' '}
                  <TextAnchor
                    href="https://zerion.io/blog/zerion-dna/"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: 'var(--primary)' }}
                  >
                    Read more
                  </TextAnchor>
                </UIText>
              </>
            )}
          </VStack>
          <HStack gap={8} alignItems="center">
            <Step
              onClick={() => setStep(0)}
              paused={state === 'paused'}
              index={0}
              activeStep={step}
            />
            <Step
              onClick={() => setStep(1)}
              paused={state === 'paused'}
              index={1}
              activeStep={step}
            />
          </HStack>
        </VStack>

        <div style={{ position: 'fixed', bottom: 18, left: 16, right: 16 }}>
          <VStack gap={16}>
            <HStack gap={16} justifyContent="space-between" alignItems="center">
              <UIText kind="small/regular">Network fee</UIText>
              {isLoading || feeValueFiat === undefined ? (
                <CircleSpinner size="12px" />
              ) : feeValueFiat === null ? null : (
                <UIText kind="small/accent">
                  {[time, formatCurrencyValue(feeValueFiat, 'en', 'usd')]
                    .filter(isTruthy)
                    .join(' · ')}
                </UIText>
              )}
            </HStack>
            {positionsAreLoading ? (
              <Button style={{ width: '100%' }} disabled={true}>
                Claim DNA
              </Button>
            ) : isEnoughEth ? (
              <Button
                style={{ width: '100%' }}
                as={UnstyledLink}
                to={{
                  pathname: '/sendTransaction',
                  search: `?${new URLSearchParams({
                    origin: 'https://app.zerion.io',
                    windowId: '1',
                    transaction: JSON.stringify(mintTransaction),
                    next: '/overview/nfts',
                  })}`,
                }}
              >
                Claim DNA
              </Button>
            ) : (
              <Button
                style={{ width: '100%' }}
                onClick={() => {
                  if (!dialogRef.current) {
                    return;
                  }
                  showConfirmDialog(dialogRef.current);
                }}
              >
                Claim DNA
              </Button>
            )}
          </VStack>
          <PageBottom />
        </div>
      </PageColumn>
    </Background>
  );
}
