import React, { useCallback, useMemo, useRef } from 'react';
import { AnimatePresence, motion, MotionConfig } from 'motion/react';
import { Networks } from 'src/modules/networks/Networks';
import type { Networks as NetworksType } from 'src/modules/networks/Networks';
import { createChain } from 'src/modules/networks/Chain';
import { useMeasure } from 'src/ui/shared/useMeasure';
import { UIText } from 'src/ui/ui-kit/UIText';
import { UnstyledButton } from 'src/ui/ui-kit/UnstyledButton';
import ChevronRightIcon from 'jsx:src/ui/assets/chevron-right.svg';
import CloseIcon from 'jsx:src/ui/assets/close.svg';
import type { SwapFormState2, HandleChangeFunction } from '../types';
import { useReceiverAddressItems } from './useReceiverAddressItems';
import { getEcosystemLabel } from './getEcosystemLabel';
import { AddressCombobox } from './AddressCombobox';
import * as styles from './ReceiverAddressSelector.module.css';

export function ReceiverAddressSelector({
  formState,
  onChange,
  onBatchChange,
  networks,
}: {
  formState: SwapFormState2;
  onChange: HandleChangeFunction;
  onBatchChange: (
    updater: (state: Partial<SwapFormState2>) => Partial<SwapFormState2>
  ) => void;
  networks: NetworksType;
}) {
  const isCrossChain =
    formState.inputChain !== (formState.outputChain ?? formState.inputChain);

  const outputNetwork = useMemo(() => {
    if (!formState.outputChain) {
      return null;
    }
    return networks.getByNetworkId(createChain(formState.outputChain));
  }, [formState.outputChain, networks]);

  const ecosystem = useMemo(() => {
    if (!outputNetwork) {
      return null;
    }
    return Networks.getEcosystem(outputNetwork);
  }, [outputNetwork]);

  const title = ecosystem
    ? `${getEcosystemLabel(ecosystem)} Recipient Address`
    : 'Recipient Address';

  const { items } = useReceiverAddressItems({
    ecosystem: ecosystem || 'evm',
  });

  const [measureRef, { height: contentHeight }] = useMeasure<HTMLDivElement>();
  const containerRef = useRef<HTMLDivElement>(null);

  const isExpanded = formState.showReceiverAddressInput === 'on';

  const handleOpen = useCallback(() => {
    onChange('showReceiverAddressInput', 'on');
  }, [onChange]);

  const handleClose = useCallback(() => {
    onBatchChange((state) => ({
      ...state,
      showReceiverAddressInput: 'off',
      to: undefined,
      receiverAddressInput: undefined,
    }));
  }, [onBatchChange]);

  const handleAddressInputChange = useCallback(
    (value: string) => {
      onChange('receiverAddressInput', value);
    },
    [onChange]
  );

  const handleResolvedChange = useCallback(
    (resolved: string | null) => {
      onChange('to', resolved ?? undefined);
    },
    [onChange]
  );

  if (!isCrossChain) {
    return null;
  }

  return (
    <MotionConfig transition={{ duration: 0.15 }}>
      <div className={styles.container} ref={containerRef}>
        {isExpanded ? (
          <div className={styles.headerRow}>
            <UIText kind="small/regular">{title}</UIText>
            <UnstyledButton
              type="button"
              className={styles.closeButton}
              onClick={handleClose}
            >
              <CloseIcon style={{ width: 20, height: 20 }} />
            </UnstyledButton>
          </div>
        ) : (
          <UnstyledButton
            type="button"
            className={styles.headerButton}
            onClick={handleOpen}
          >
            <UIText kind="small/regular">{title}</UIText>
            <ChevronRightIcon
              className={styles.chevronDown}
              style={{ width: 20, height: 20 }}
            />
          </UnstyledButton>
        )}
        <AnimatePresence initial={false}>
          {isExpanded ? (
            <motion.div
              key="receiver-expanded"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: contentHeight || 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              style={{ overflow: 'hidden' }}
            >
              <motion.div
                ref={measureRef}
                initial={{ y: 6, filter: 'blur(3px)', opacity: 0 }}
                animate={{ y: 0, filter: 'blur(0px)', opacity: 1 }}
                exit={{ y: 6, filter: 'blur(3px)', opacity: 0 }}
                style={{ transformOrigin: 'top center' }}
              >
                <div className={styles.comboboxWrapper}>
                  <AddressCombobox
                    items={items}
                    value={formState.receiverAddressInput ?? ''}
                    onChange={handleAddressInputChange}
                    onResolvedChange={handleResolvedChange}
                    anchorRef={containerRef}
                  />
                </div>
              </motion.div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </MotionConfig>
  );
}
