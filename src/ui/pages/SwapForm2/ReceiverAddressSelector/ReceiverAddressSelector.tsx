import React, { useCallback, useMemo } from 'react';
import { Networks } from 'src/modules/networks/Networks';
import type { Networks as NetworksType } from 'src/modules/networks/Networks';
import { createChain } from 'src/modules/networks/Chain';
import { truncateAddress } from 'src/ui/shared/truncateAddress';
import { WalletAvatar } from 'src/ui/components/WalletAvatar';
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

  const isExpanded = formState.showReceiverAddressInput === 'on';

  const handleOpen = useCallback(() => {
    onChange('showReceiverAddressInput', 'on');
  }, [onChange]);

  const handleClose = useCallback(() => {
    onBatchChange(() => ({
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

  if (!isExpanded) {
    return (
      <UnstyledButton
        type="button"
        className={styles.container}
        onClick={handleOpen}
        style={{ width: '100%' }}
      >
        <div className={styles.headerRow}>
          <UIText kind="small/regular">{title}</UIText>
          <ChevronRightIcon
            className={styles.chevronDown}
            style={{ width: 20, height: 20 }}
          />
        </div>
      </UnstyledButton>
    );
  }

  return (
    <div className={styles.container}>
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
      {formState.to ? (
        <div className={styles.addressRow}>
          <WalletAvatar address={formState.to} size={24} borderRadius={6} />
          <UIText
            kind="small/accent"
            style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}
          >
            {truncateAddress(formState.to, 5)}
          </UIText>
          <ChevronRightIcon
            className={styles.chevronRight}
            style={{ width: 24, height: 24 }}
          />
        </div>
      ) : null}
      <div className={styles.comboboxWrapper}>
        <AddressCombobox
          items={items}
          value={formState.receiverAddressInput ?? ''}
          onChange={handleAddressInputChange}
          onResolvedChange={handleResolvedChange}
        />
      </div>
    </div>
  );
}
