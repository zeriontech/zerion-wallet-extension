import React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import LedgerIcon from 'jsx:src/ui/assets/ledger-icon.svg';
import { Dialog2 } from 'src/ui/ui-kit/ModalDialogs/Dialog2/Dialog2';
import { UIText } from 'src/ui/ui-kit/UIText';
import { Button } from 'src/ui/ui-kit/Button';
import { TokenIcon } from 'src/ui/ui-kit/TokenIcon';
import { NetworkIcon } from 'src/ui/components/NetworkIcon';
import { WalletAvatar } from 'src/ui/components/WalletAvatar';
import { CircleSpinner } from 'src/ui/ui-kit/CircleSpinner';
import { VStack } from 'src/ui/ui-kit/VStack';
import { TransactionStepper } from 'src/ui/components/TransactionStepper';
import type { ToasterView } from '../types';
import { cancelQueue } from '../store';
import { AnimatedIcons } from './AnimatedIcons';
import {
  useHardwareDialogSession,
  type HardwareDialogSession,
} from './useHardwareDialogSession';
import * as s from './styles.module.css';

const ICON_SIZE = 72;
const CHAIN_BADGE_SIZE = Math.round(ICON_SIZE * 0.375);

function TokenWithChain({
  iconUrl,
  symbol,
  chainIconUrl,
}: {
  iconUrl: string | null;
  symbol: string;
  chainIconUrl: string | null;
}) {
  return (
    <div className={s.tokenWithChain}>
      <TokenIcon src={iconUrl ?? undefined} symbol={symbol} size={ICON_SIZE} />
      {chainIconUrl ? (
        <div className={s.chainBadge}>
          <NetworkIcon src={chainIconUrl} name={null} size={CHAIN_BADGE_SIZE} />
        </div>
      ) : null}
    </div>
  );
}

const PENDING_TITLE: Record<ToasterView['kind'], string> = {
  approve: 'Approving',
  swap: 'Swapping',
  bridge: 'Bridging',
  send: 'Sending',
};

const SUCCESS_TITLE: Record<ToasterView['kind'], string> = {
  approve: 'Approved',
  swap: 'Swapped',
  bridge: 'Bridged',
  send: 'Sent',
};

function getTitle(session: HardwareDialogSession): string {
  if (session.terminal === 'failed') return 'Failed';
  if (session.terminal === 'aborted') return 'Cancelled';
  const view = session.activeView;
  if (session.terminal === 'success' && view) return SUCCESS_TITLE[view.kind];
  if (session.terminal === 'success') return 'Done';

  if (!view) return 'Sign on Device';
  if (session.activeStatus === 'pending') return PENDING_TITLE[view.kind];
  if (session.activeStatus === 'confirmed') return SUCCESS_TITLE[view.kind];
  if (session.activeStatus === 'failed') return 'Failed';
  return 'Confirm in Wallet';
}

function getIconPhase(
  session: HardwareDialogSession
): 'start' | 'transitioning' | 'complete' | 'failed' {
  if (session.terminal === 'failed' || session.activeStatus === 'failed')
    return 'failed';
  if (session.terminal === 'success' || session.activeStatus === 'confirmed')
    return 'complete';
  if (session.activeStatus === 'pending') return 'transitioning';
  return 'start';
}

function isWaitingForSignature(session: HardwareDialogSession): boolean {
  if (session.terminal != null) return false;
  if (!session.activeView) return false;
  return (
    session.activeStatus === 'signing' || session.activeStatus === 'waiting'
  );
}

function StatusTitle({
  title,
  isPending,
}: {
  title: string;
  isPending: boolean;
}) {
  return (
    <div className={s.titleContainer}>
      <AnimatePresence mode="popLayout">
        <motion.div
          key={title}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ type: 'spring', stiffness: 280, damping: 24 }}
          className={s.titleItem}
        >
          <UIText kind="headline/h2">
            {title}
            {isPending ? (
              <span className={s.dots}>
                <span />
                <span />
                <span />
              </span>
            ) : null}
          </UIText>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function getIconNodes(
  view: ToasterView | null,
  showLedger: boolean
): {
  startItem: React.ReactNode;
  endItem: React.ReactNode | null;
} {
  if (showLedger) {
    return {
      startItem: <LedgerIcon style={{ width: ICON_SIZE, height: ICON_SIZE }} />,
      endItem: null,
    };
  }

  if (!view) {
    return {
      startItem: (
        <div className={s.spinnerSlot}>
          <CircleSpinner size="32px" />
        </div>
      ),
      endItem: null,
    };
  }

  if (view.kind === 'approve') {
    return {
      startItem: (
        <TokenWithChain
          iconUrl={view.token.iconUrl}
          symbol={view.token.symbol}
          chainIconUrl={view.chain.iconUrl}
        />
      ),
      endItem: null,
    };
  }

  if (view.kind === 'send') {
    return {
      startItem: (
        <TokenWithChain
          iconUrl={view.token.iconUrl}
          symbol={view.token.symbol}
          chainIconUrl={view.chain.iconUrl}
        />
      ),
      endItem: (
        <WalletAvatar
          address={view.recipient.address}
          size={ICON_SIZE}
          borderRadius={ICON_SIZE / 2}
        />
      ),
    };
  }

  // swap | bridge
  return {
    startItem: (
      <TokenWithChain
        iconUrl={view.sent.iconUrl}
        symbol={view.sent.symbol}
        chainIconUrl={null}
      />
    ),
    endItem: (
      <TokenWithChain
        iconUrl={view.received.iconUrl}
        symbol={view.received.symbol}
        chainIconUrl={view.receivedChain.iconUrl}
      />
    ),
  };
}

export function HardwareDialog({
  ledgerDialogOpen,
}: {
  ledgerDialogOpen: boolean;
}) {
  const session = useHardwareDialogSession();
  const open = session.visible;
  const isMultiStep = session.steps.length > 1;
  const isTerminal = session.terminal != null;

  const title = getTitle(session);
  const phase = getIconPhase(session);
  const isPending = !isTerminal && session.activeStatus === 'pending';
  const showLedger = isWaitingForSignature(session);

  const isLastStep =
    session.steps.length > 0 &&
    session.activeIndex === session.steps.length - 1;
  const showStepper =
    isMultiStep && !(isLastStep && !isWaitingForSignature(session));

  const handleClose = () => {
    if (!session.queueId) return session.reset();
    if (isTerminal) {
      session.reset();
    } else {
      cancelQueue(session.queueId);
    }
  };

  const handleCancel = () => {
    if (!session.queueId) return;
    cancelQueue(session.queueId);
  };

  const handleDone = () => {
    session.reset();
  };

  const { startItem, endItem } = getIconNodes(session.activeView, showLedger);

  return (
    <Dialog2
      open={open}
      onClose={handleClose}
      size="full"
      autoFocusInput={false}
      style={{ background: 'var(--white)' }}
    >
      <div className={s.root}>
        <VStack gap={20} className={s.topHalf}>
          <AnimatedIcons
            startItem={startItem}
            endItem={endItem}
            phase={phase}
            size="big"
          />
          <StatusTitle title={title} isPending={isPending} />
          {isMultiStep ? (
            <AnimatePresence mode="popLayout" initial={false}>
              {showStepper ? (
                <motion.div
                  key="stepper"
                  initial={{ opacity: 0, y: 8, filter: 'blur(2px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, y: -12, filter: 'blur(2px)' }}
                  transition={{ duration: 0.15, ease: 'easeOut' }}
                >
                  <TransactionStepper steps={session.steps} />
                </motion.div>
              ) : (
                <motion.div
                  key="stepper-placeholder"
                  aria-hidden={true}
                  style={{ visibility: 'hidden' }}
                >
                  <TransactionStepper steps={session.steps} />
                </motion.div>
              )}
            </AnimatePresence>
          ) : null}
          <motion.div
            aria-hidden={true}
            initial={false}
            animate={{ height: ledgerDialogOpen ? 200 : 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            style={{ visibility: 'hidden', flexShrink: 0 }}
          />
        </VStack>
        <VStack gap={16} className={s.bottom}>
          {session.terminal === 'failed' && session.errorMessage ? (
            <span className={s.errorMessage}>{session.errorMessage}</span>
          ) : null}
          <div className={s.buttonSlot}>
            {isTerminal ? (
              <Button
                kind="regular"
                style={{ width: '100%' }}
                onClick={handleDone}
              >
                Done
              </Button>
            ) : session.activeStatus === 'pending' ? (
              <Button kind="regular" disabled={true} style={{ width: '100%' }}>
                Pending
              </Button>
            ) : (
              <Button
                kind="regular"
                style={{ width: '100%' }}
                onClick={handleCancel}
              >
                Cancel
              </Button>
            )}
          </div>
        </VStack>
      </div>
    </Dialog2>
  );
}
