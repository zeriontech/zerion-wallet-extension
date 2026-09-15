import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useStore } from '@store-unit/react';
import { AnimatePresence, motion } from 'motion/react';
import type { AddressPosition } from 'src/defi-sdk.types';
import { useCurrency } from 'src/modules/currency/useCurrency';
import { createChain } from 'src/modules/networks/Chain';
import { useNetworks } from 'src/modules/networks/useNetworks';
import { useHttpClientSource } from 'src/modules/zerion-api/hooks/useHttpClientSource';
import { useHttpAddressPositions } from 'src/modules/zerion-api/hooks/useWalletPositions';
import { normalizeAddress } from 'src/shared/normalizeAddress';
import { invariant } from 'src/shared/invariant';
import { isDeviceAccount } from 'src/shared/types/validators';
import { getAddressType } from 'src/shared/wallet/classifiers';
import type { Permit } from 'src/modules/zerion-api/requests/wallet-prepare-permits';
import { useGlobalPreferences } from 'src/ui/features/preferences/usePreferences';
import { HardwareSignMessage } from 'src/ui/pages/HardwareWalletConnection/HardwareSignMessage';
import type { SignMessageHandle } from 'src/ui/pages/HardwareWalletConnection/HardwareSignMessage';
import { TextPulse } from 'src/ui/components/TextPulse';
import { NetworkIcon } from 'src/ui/components/NetworkIcon';
import { useAddressParams } from 'src/ui/shared/user-address/useAddressParams';
import { useMeasure } from 'src/ui/shared/useMeasure';
import { Button } from 'src/ui/ui-kit/Button';
import { CircleSpinner } from 'src/ui/ui-kit/CircleSpinner';
import { HStack } from 'src/ui/ui-kit/HStack';
import { Media } from 'src/ui/ui-kit/Media';
import { Dialog2 } from 'src/ui/ui-kit/ModalDialogs/Dialog2';
import { TokenIcon } from 'src/ui/ui-kit/TokenIcon';
import { UIText } from 'src/ui/ui-kit/UIText';
import { VStack } from 'src/ui/ui-kit/VStack';
import { trackConfidentialEvent } from './analytics';
import { ConfidentialMask, ConfidentialNameLock } from './ConfidentialMask';
import { getEncryptedPositions } from './detection';
import {
  PermitSigningError,
  createLedgerPermitSigner,
  preparePermits,
  signPermits,
} from './revealConfidentialBalances';
import { SigningSteps } from './SigningSteps';
import { useWalletByAddress } from './useConfidentialPermits';
import {
  closeRevealDialog,
  revealDialogStore,
  type RevealDialogRequest,
} from './revealDialogStore';
import { useIsSignableWallet } from './useIsSignableWallet';
import * as styles from './styles.module.css';

/** `HardwareSignMessage` maps a device-side rejection to this message */
function isDeniedOnDevice(error: unknown) {
  return (
    error instanceof PermitSigningError &&
    error.cause instanceof Error &&
    error.cause.message === 'Signature denied by user'
  );
}

/** Give the refetch this long to land before closing anyway */
const REFETCH_TIMEOUT_MS = 10_000;

/**
 * The crossfade every view of the card swaps with — the same blur-shift the
 * web app's Decrypt Dialog uses, so the two read as one flow.
 */
const viewVariants = {
  initial: { opacity: 0, filter: 'blur(4px)' },
  animate: { opacity: 1, filter: 'blur(0px)' },
  exit: { opacity: 0, filter: 'blur(4px)' },
};
const VIEW_TRANSITION = { duration: 0.15 };

type FlowStep =
  | { type: 'intro' }
  | { type: 'revealing' }
  /** Ledger only: permit `currentIndex` is on the device */
  | { type: 'signing'; permits: Permit[]; currentIndex: number }
  /** `permits` is set for a Ledger Reveal so the Signing steps stay up */
  | { type: 'refetching'; revealedAt: number; permits?: Permit[] }
  | { type: 'empty' }
  | { type: 'failed'; error: Error };

function EncryptedPositionRow({ position }: { position: AddressPosition }) {
  const { networks } = useNetworks();
  const network = networks?.getNetworkByName(createChain(position.chain));
  return (
    <HStack
      gap={8}
      justifyContent="space-between"
      alignItems="center"
      className={styles.positionRow}
    >
      <Media
        vGap={0}
        gap={12}
        image={
          <TokenIcon
            size={36}
            symbol={position.asset.symbol}
            src={position.asset.icon_url}
          />
        }
        text={
          <HStack gap={4} alignItems="center" style={{ justifySelf: 'start' }}>
            <UIText
              kind="body/accent"
              style={{
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {position.asset.name}
            </UIText>
            <ConfidentialNameLock />
          </HStack>
        }
        detailText={
          <HStack gap={4} alignItems="center" style={{ justifySelf: 'start' }}>
            <NetworkIcon
              size={16}
              name={network?.name || position.chain}
              src={network?.iconUrl}
            />
            <UIText kind="small/regular" color="var(--neutral-500)">
              {position.asset.symbol}
            </UIText>
          </HStack>
        }
      />
      <ConfidentialMask kind="body/regular" interactive={false} />
    </HStack>
  );
}

function RevealDialogContent({
  address,
  trigger,
  onClose,
}: RevealDialogRequest & { onClose: () => void }) {
  const { currency } = useCurrency();
  const source = useHttpClientSource();
  const { singleAddressNormalized } = useAddressParams();
  const isSignable = useIsSignableWallet(address);
  // Reveal is offered only for the *current* wallet: the background signs
  // with it, and one rule for every wallet type is easier to reason about
  const canReveal =
    isSignable === true &&
    normalizeAddress(address) === singleAddressNormalized;
  const { data: wallet } = useWalletByAddress(address);
  const ledgerWallet = wallet && isDeviceAccount(wallet) ? wallet : null;
  const hardwareSignRef = useRef<SignMessageHandle | null>(null);
  const { globalPreferences } = useGlobalPreferences();

  const positionsQuery = useHttpAddressPositions(
    { addresses: [address], currency },
    { source },
    { suspense: false, keepPreviousData: true }
  );
  const encryptedPositions = useMemo(
    () => getEncryptedPositions(positionsQuery.data?.data),
    [positionsQuery.data]
  );
  const encryptedChainsCount = useMemo(
    () => new Set(encryptedPositions.map((position) => position.chain)).size,
    [encryptedPositions]
  );

  const [flowStep, setFlowStep] = useState<FlowStep>({ type: 'intro' });
  const flowStepRef = useRef(flowStep);
  flowStepRef.current = flowStep;

  // one "shown" per open; the permit count is unknown until Reveal, so the
  // number of encrypted chains stands in for it (one permit per chain)
  const shownRef = useRef(false);
  useEffect(() => {
    if (shownRef.current || !positionsQuery.isFetched) {
      return;
    }
    shownRef.current = true;
    trackConfidentialEvent({
      name: 'dialogShown',
      params: { trigger, permit_count: encryptedChainsCount },
    });
  }, [positionsQuery.isFetched, encryptedChainsCount, trigger]);

  // Closing short of a completed Reveal counts as a dismissal
  useEffect(() => {
    return () => {
      const step = flowStepRef.current;
      if (step.type === 'intro' || step.type === 'empty') {
        trackConfidentialEvent({
          name: 'decryptDismissed',
          params: { stage: 'intro' },
        });
      } else if (step.type === 'revealing' || step.type === 'signing') {
        trackConfidentialEvent({
          name: 'decryptDismissed',
          params: { stage: 'signing' },
        });
      } else if (step.type === 'failed') {
        trackConfidentialEvent({
          name: 'decryptDismissed',
          params: { stage: 'failed' },
        });
      }
    };
  }, []);

  const revealMutation = useMutation({
    mutationFn: async () => {
      const permits = await preparePermits(address, source);
      trackConfidentialEvent({
        name: 'decryptStarted',
        params: { permit_count: permits.length },
      });
      if (permits.length === 0) {
        return { permits };
      }
      if (ledgerWallet) {
        invariant(
          hardwareSignRef.current,
          'HardwareSignMessage must be mounted'
        );
        const signOnDevice = hardwareSignRef.current.signTypedData_v4;
        await signPermits(address, permits, {
          sign: createLedgerPermitSigner(address, signOnDevice),
          onStep: (currentIndex) =>
            setFlowStep({ type: 'signing', permits, currentIndex }),
        });
      } else {
        await signPermits(address, permits);
      }
      return { permits };
    },
    onMutate: () => setFlowStep({ type: 'revealing' }),
    onSuccess: ({ permits }) => {
      if (permits.length === 0) {
        setFlowStep({ type: 'empty' });
        return;
      }
      trackConfidentialEvent({
        name: 'decryptCompleted',
        params: { permit_count: permits.length },
      });
      setFlowStep({
        type: 'refetching',
        revealedAt: Date.now(),
        permits: ledgerWallet ? permits : undefined,
      });
    },
    onError: (error: unknown) => {
      const index = error instanceof PermitSigningError ? error.index : 0;
      trackConfidentialEvent({
        name: 'decryptFailed',
        params: {
          index,
          reason: isDeniedOnDevice(error) ? 'rejected' : 'error',
        },
      });
      setFlowStep({
        type: 'failed',
        error: error instanceof Error ? error : new Error(String(error)),
      });
    },
  });

  // Stay on the loader until the positions came back with the new permits
  // (the key changed, so a fresh response is on its way), then close
  const { dataUpdatedAt, isFetching } = positionsQuery;
  useEffect(() => {
    if (flowStep.type !== 'refetching') {
      return;
    }
    if (dataUpdatedAt > flowStep.revealedAt && !isFetching) {
      onClose();
      return;
    }
    const timer = setTimeout(onClose, REFETCH_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [flowStep, dataUpdatedAt, isFetching, onClose]);

  const [measureRef, { height }] = useMeasure<HTMLDivElement>();
  // Ledger: the Signing steps stay up through the refetch, all rows signed
  const signingSteps =
    flowStep.type === 'signing'
      ? flowStep
      : flowStep.type === 'refetching' && flowStep.permits
      ? { permits: flowStep.permits, currentIndex: flowStep.permits.length }
      : null;
  const isLoading =
    !signingSteps &&
    (flowStep.type === 'revealing' || flowStep.type === 'refetching');
  // The device button is rendered by the dialog, outside the crossfading
  // views, so the Ledger iframe survives every view change
  const isSigningOnDevice =
    flowStep.type === 'revealing' || flowStep.type === 'signing';
  const showLedgerFooter =
    Boolean(ledgerWallet && canReveal) &&
    (flowStep.type === 'intro' ||
      flowStep.type === 'revealing' ||
      flowStep.type === 'signing' ||
      flowStep.type === 'failed');

  return (
    <VStack gap={16} style={{ padding: '0 16px 24px' }}>
      <div className={styles.card}>
        <motion.div
          animate={{ height: height > 0 ? height : 'auto' }}
          transition={{ duration: 0.15, bounce: 0 }}
          style={{ overflow: 'hidden' }}
        >
          <div ref={measureRef}>
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.div
                key={
                  signingSteps ? 'steps' : isLoading ? 'loading' : flowStep.type
                }
                variants={viewVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={VIEW_TRANSITION}
              >
                {signingSteps ? (
                  <SigningSteps
                    permits={signingSteps.permits}
                    currentIndex={signingSteps.currentIndex}
                  />
                ) : isLoading ? (
                  <VStack
                    gap={12}
                    style={{
                      justifyItems: 'center',
                      textAlign: 'center',
                      padding: '32px 0',
                    }}
                  >
                    <CircleSpinner
                      size="32px"
                      trackWidth="3px"
                      color="var(--primary)"
                    />
                    <UIText kind="body/accent">Decrypting balances…</UIText>
                    <UIText kind="small/regular" color="var(--neutral-500)">
                      Signing happens on this device and sends no transaction.
                    </UIText>
                  </VStack>
                ) : flowStep.type === 'failed' ? (
                  <VStack gap={16}>
                    <VStack gap={8}>
                      <UIText kind="headline/h3">
                        Couldn't decrypt the balances
                      </UIText>
                      <UIText kind="body/regular" color="var(--neutral-600)">
                        Please try again.
                      </UIText>
                      <UIText
                        kind="caption/regular"
                        color="var(--negative-500)"
                        style={{ overflowWrap: 'anywhere' }}
                      >
                        {flowStep.error.message}
                      </UIText>
                    </VStack>
                    {ledgerWallet ? null : (
                      <VStack gap={8}>
                        <Button
                          kind="primary"
                          onClick={() => revealMutation.mutate()}
                        >
                          Try again
                        </Button>
                        <Button kind="regular" onClick={onClose}>
                          Close
                        </Button>
                      </VStack>
                    )}
                  </VStack>
                ) : flowStep.type === 'empty' ? (
                  <VStack gap={16}>
                    <VStack gap={8}>
                      <UIText kind="headline/h3">
                        Nothing to decrypt right now
                      </UIText>
                      <UIText kind="body/regular" color="var(--neutral-600)">
                        The backend issued no decryption permits for this
                        wallet. Please try again later.
                      </UIText>
                    </VStack>
                    <Button kind="regular" onClick={onClose}>
                      Close
                    </Button>
                  </VStack>
                ) : (
                  <VStack gap={16}>
                    <VStack gap={8}>
                      <UIText kind="small/regular" color="var(--neutral-600)">
                        Some tokens in this wallet are encrypted onchain, so
                        nobody can see the amounts.
                      </UIText>
                      <UIText kind="small/regular" color="var(--neutral-600)">
                        {canReveal
                          ? ledgerWallet
                            ? 'Confirm a decryption permit for each chain on your Ledger to reveal the amounts and count them in your total.'
                            : 'Decrypt them with your wallet to reveal the amounts and count them in your total.'
                          : 'Amounts can only be revealed from a wallet whose keys this extension holds or a connected Ledger.'}
                      </UIText>
                    </VStack>
                    {canReveal && !ledgerWallet ? (
                      <Button
                        kind="primary"
                        onClick={() => revealMutation.mutate()}
                      >
                        Reveal
                      </Button>
                    ) : null}
                  </VStack>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>
        {showLedgerFooter && ledgerWallet ? (
          <VStack gap={8} style={{ marginTop: 16 }}>
            <HardwareSignMessage
              ref={hardwareSignRef}
              derivationPath={ledgerWallet.derivationPath}
              ecosystem={getAddressType(address)}
              isSigning={isSigningOnDevice}
              buttonTitle={
                flowStep.type === 'failed' ? 'Try again' : 'Reveal with Ledger'
              }
              bluetoothSupportEnabled={Boolean(
                globalPreferences?.bluetoothSupportEnabled
              )}
              keyboardShortcutEnabled={false}
              showSigningSettings={false}
              onClick={() => revealMutation.mutate()}
            >
              {flowStep.type === 'revealing' ? (
                <TextPulse>Preparing…</TextPulse>
              ) : flowStep.type === 'signing' ? (
                <TextPulse>Sign on Device</TextPulse>
              ) : undefined}
            </HardwareSignMessage>
            {flowStep.type === 'failed' ? (
              <Button kind="regular" onClick={onClose}>
                Close
              </Button>
            ) : null}
          </VStack>
        ) : null}
      </div>
      {encryptedPositions.length ? (
        <VStack gap={0} style={{ paddingInline: 4 }}>
          {encryptedPositions.map((position) => (
            <EncryptedPositionRow key={position.id} position={position} />
          ))}
        </VStack>
      ) : positionsQuery.isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 16 }}>
          <CircleSpinner size="20px" color="var(--neutral-500)" />
        </div>
      ) : null}
    </VStack>
  );
}

/**
 * App-level host of the Reveal Dialog. Opens for whatever request lands in
 * `revealDialogStore` (the panel, a tapped mask); keeps the last request
 * while closing so the exit animation has content.
 */
export function ConfidentialRevealDialog() {
  const request = useStore(revealDialogStore);
  const [lastRequest, setLastRequest] = useState(request);
  useEffect(() => {
    if (request) {
      setLastRequest(request);
    }
  }, [request]);
  const current = request ?? lastRequest;
  return (
    <Dialog2
      open={Boolean(request)}
      onClose={closeRevealDialog}
      title="Confidential Balances"
      size="full"
      autoFocusInput={false}
    >
      {current ? (
        <RevealDialogContent
          key={`${current.address}-${current.trigger}`}
          address={current.address}
          trigger={current.trigger}
          onClose={closeRevealDialog}
        />
      ) : null}
    </Dialog2>
  );
}
