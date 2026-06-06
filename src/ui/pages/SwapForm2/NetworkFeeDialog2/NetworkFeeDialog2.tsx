import React, { useState } from 'react';
import { DialogDismiss } from '@ariakit/react';
import { AnimatePresence, motion, MotionConfig } from 'motion/react';
import type {
  CustomConfiguration,
  NetworkFeeConfiguration,
} from '@zeriontech/transactions';
import type { ChainGasPrice } from 'src/modules/ethereum/transactions/gasPrices/types';
import type { Chain } from 'src/modules/networks/Chain';
import { Dialog2 } from 'src/ui/ui-kit/ModalDialogs/Dialog2';
import { UIText } from 'src/ui/ui-kit/UIText';
import { Button } from 'src/ui/ui-kit/Button';
import CloseIcon from 'jsx:src/ui/assets/close.svg';
import ChevronLeftIcon from 'jsx:src/ui/assets/chevron-left-medium.svg';
import type { NetworkFeeQuote } from '../getNetworkFeeForSpeed';
import { NetworkFeeTypeSelector } from './NetworkFeeTypeSelector';
import {
  NetworkFeeCustomForm,
  type CustomFormDefaults,
} from './NetworkFeeCustomForm';
import * as styles from './NetworkFeeDialog2.module.css';

type View = 'selector' | 'custom';

function Header({ view, onBack }: { view: View; onBack: () => void }) {
  return (
    <div className={styles.header}>
      <div className={styles.headerLeft}>
        {view === 'custom' ? (
          <Button
            type="button"
            kind="ghost"
            size={32}
            aria-label="Go back"
            onClick={onBack}
            style={{ padding: '0 8px', minWidth: 32 }}
          >
            <ChevronLeftIcon
              style={{ display: 'block', width: 16, height: 16 }}
            />
          </Button>
        ) : null}
      </div>
      <UIText kind="body/accent" className={styles.headerTitle}>
        {view === 'selector' ? 'Network Fee' : 'Custom'}
      </UIText>
      <div className={styles.headerRight}>
        <DialogDismiss className={styles.iconButton} aria-label="Close">
          <CloseIcon style={{ width: 20, height: 20, display: 'block' }} />
        </DialogDismiss>
      </div>
    </div>
  );
}

export function NetworkFeeDialog2({
  open,
  onClose,
  onSubmit,
  txType,
  configuration,
  defaults,
  quote = null,
  gasPrices = null,
  baseFee = null,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (value: NetworkFeeConfiguration) => void;
  chain: Chain;
  /** EVM transaction type. `'0x2'` or `2` selects the EIP-1559 form; anything else falls back to the Classic form. */
  txType: string | number | null | undefined;
  /** Current configuration — selects which preset/Custom is highlighted. Defaults to "fast" when omitted. */
  configuration?: CustomConfiguration;
  /** Quote-derived default values (GWEI) for the custom form. */
  defaults?: CustomFormDefaults;
  /** Active quote, used to show per-preset fee prices in the selector. */
  quote?: NetworkFeeQuote | null;
  /** Current chain gas prices, used to price each preset. */
  gasPrices?: ChainGasPrice | null;
  /** Current EIP-1559 base fee (wei), used to compute effective prices. */
  baseFee?: number | null;
}) {
  const [view, setView] = useState<View>('selector');

  // Prefer detecting EIP-1559 from the transaction's own gas fields: if it
  // carries maxFee/maxPriorityFee it's a 1559 tx, regardless of `type` (which
  // can be stripped once gas prices are assigned). Fall back to `txType` when
  // no quote tx is available.
  const swapEvm = quote?.transactionSwap?.evm;
  const isEip1559 = swapEvm
    ? swapEvm.maxFee != null || swapEvm.maxPriorityFee != null
    : Number(txType) === 2;
  const selectedSpeed = configuration?.networkFee.speed ?? 'fast';

  const handleClose = () => {
    setView('selector');
    onClose();
  };

  const handlePresetSelect = (value: NetworkFeeConfiguration) => {
    onSubmit(value);
    handleClose();
  };

  const handleCustomSubmit = (value: NetworkFeeConfiguration) => {
    onSubmit(value);
    handleClose();
  };

  return (
    <Dialog2
      open={open}
      onClose={handleClose}
      size="content"
      autoFocusInput={false}
      animateContentSize
    >
      <MotionConfig transition={{ duration: 0.2, ease: 'easeInOut' }}>
        <div className={styles.container}>
          <Header view={view} onBack={() => setView('selector')} />
          <div className={styles.body}>
            <AnimatePresence initial={false} mode="popLayout">
              {view === 'selector' ? (
                <motion.div
                  key="selector"
                  initial={{ opacity: 0, y: -30, filter: 'blur(4px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, y: -30, filter: 'blur(4px)' }}
                >
                  <NetworkFeeTypeSelector
                    selectedSpeed={selectedSpeed}
                    quote={quote}
                    gasPrices={gasPrices}
                    baseFee={baseFee}
                    onSelectPreset={handlePresetSelect}
                    onSelectCustom={() => setView('custom')}
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="custom"
                  initial={{ opacity: 0, y: -30, filter: 'blur(4px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, y: -30, filter: 'blur(4px)' }}
                >
                  <NetworkFeeCustomForm
                    isEip1559={isEip1559}
                    defaults={defaults}
                    configuration={configuration}
                    quote={quote}
                    baseFee={baseFee}
                    onSubmit={handleCustomSubmit}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </MotionConfig>
    </Dialog2>
  );
}
