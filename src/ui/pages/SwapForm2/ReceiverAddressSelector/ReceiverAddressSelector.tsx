import React, { useCallback, useMemo } from 'react';
import cn from 'classnames';
import { Networks } from 'src/modules/networks/Networks';
import type { Networks as NetworksType } from 'src/modules/networks/Networks';
import { createChain } from 'src/modules/networks/Chain';
import { normalizeAddress } from 'src/shared/normalizeAddress';
import { isMatchForEcosystem } from 'src/shared/wallet/shared';
import { truncateAddress } from 'src/ui/shared/truncateAddress';
import { BlockieImg } from 'src/ui/components/BlockieImg';
import { UIText } from 'src/ui/ui-kit/UIText';
import { VStack } from 'src/ui/ui-kit/VStack';
import { UnstyledButton } from 'src/ui/ui-kit/UnstyledButton';
import {
  ReceiverAddressDialog,
  useReceiverDisplayName,
} from 'src/ui/components/ReceiverAddressDialog';
import { useDialog2 } from 'src/ui/ui-kit/ModalDialogs/Dialog2';
import ChevronRightIcon from 'jsx:src/ui/assets/chevron-right.svg';
import CloseIcon from 'jsx:src/ui/assets/close.svg';
import type { SwapFormState2, HandleChangeFunction } from '../types';
import { getEcosystemLabel } from './getEcosystemLabel';
import * as styles from './ReceiverAddressSelector.module.css';

const AVATAR_SIZE = 36;
const AVATAR_RADIUS = 10;

export function ReceiverAddressSelector({
  formState,
  onChange,
  networks,
  isCrossEcosystem,
  receiverEcosystemMismatch,
  receiveToAnotherAddress,
}: {
  formState: SwapFormState2;
  onChange: HandleChangeFunction;
  networks: NetworksType;
  isCrossEcosystem: boolean;
  receiverEcosystemMismatch: boolean;
  receiveToAnotherAddress: boolean;
}) {
  const isCrossChain = formState.inputChain !== formState.outputChain;
  const dialog = useDialog2();

  const outputNetwork = useMemo(() => {
    return networks.getByNetworkId(createChain(formState.outputChain));
  }, [formState.outputChain, networks]);

  const ecosystem = useMemo(() => {
    if (!outputNetwork) return null;
    return Networks.getEcosystem(outputNetwork);
  }, [outputNetwork]);

  const triggerTitle = ecosystem
    ? `${getEcosystemLabel(ecosystem)} Recipient Address`
    : 'Recipient Address';

  const dialogTitle = ecosystem
    ? `${getEcosystemLabel(ecosystem)} Recipient`
    : 'Recipient';

  const normalizedTo = formState.to ? normalizeAddress(formState.to) : null;
  const display = useReceiverDisplayName(normalizedTo);
  const previewUrl = display.avatarUrl;
  const resolvedTitle = normalizedTo
    ? display.addressBookName ||
      display.walletName ||
      display.handle ||
      truncateAddress(normalizedTo, 4)
    : null;

  const handleSelect = useCallback(
    (address: string) => {
      onChange('to', address);
    },
    [onChange]
  );

  const handleClear = useCallback(
    (event: React.MouseEvent) => {
      event.stopPropagation();
      onChange('to', undefined);
    },
    [onChange]
  );

  const predicate = useCallback(
    (address: string) => {
      if (!ecosystem) return true;
      return isMatchForEcosystem(address, ecosystem);
    },
    [ecosystem]
  );

  const validateMatch = useCallback(
    (address: string): string => {
      if (!ecosystem || !outputNetwork) return '';
      if (isMatchForEcosystem(address, ecosystem)) return '';
      const wrongLabel = ecosystem === 'evm' ? 'Solana' : 'Ethereum';
      return `This is a ${wrongLabel} address. Enter a ${getEcosystemLabel(
        ecosystem
      )} address for ${outputNetwork.name}.`;
    },
    [ecosystem, outputNetwork]
  );

  const visible = isCrossEcosystem || (isCrossChain && receiveToAnotherAddress);
  if (!visible) {
    return null;
  }

  const hasValue = Boolean(formState.to);
  const addressHead = normalizedTo ? normalizedTo.slice(0, -6) : '';
  const addressTail = normalizedTo ? normalizedTo.slice(-6) : '';

  return (
    <>
      <div
        className={cn(styles.container, {
          [styles.containerError]: receiverEcosystemMismatch,
        })}
      >
        <UnstyledButton
          type="button"
          className={styles.triggerOverlay}
          onClick={dialog.openDialog}
          aria-label={triggerTitle}
        />
        {hasValue && normalizedTo ? (
          <div className={styles.contentLayer}>
            <div className={styles.valueRow}>
              <div
                style={{
                  width: AVATAR_SIZE,
                  height: AVATAR_SIZE,
                  borderRadius: AVATAR_RADIUS,
                  flexShrink: 0,
                  overflow: 'hidden',
                }}
              >
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt=""
                    width={AVATAR_SIZE}
                    height={AVATAR_SIZE}
                    style={{
                      width: AVATAR_SIZE,
                      height: AVATAR_SIZE,
                      borderRadius: AVATAR_RADIUS,
                      objectFit: 'cover',
                      display: 'block',
                    }}
                  />
                ) : (
                  <BlockieImg
                    address={normalizedTo}
                    size={AVATAR_SIZE}
                    borderRadius={AVATAR_RADIUS}
                  />
                )}
              </div>
              <VStack gap={0} className={styles.valueColumn}>
                <UIText
                  kind="body/accent"
                  style={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {resolvedTitle}
                </UIText>
                <div className={styles.addressRow}>
                  <UIText
                    kind="caption/regular"
                    color="var(--neutral-500)"
                    className={styles.addressHead}
                  >
                    {addressHead}
                  </UIText>
                  <UIText
                    kind="caption/regular"
                    color="var(--neutral-500)"
                    className={styles.addressTail}
                  >
                    {addressTail}
                  </UIText>
                </div>
              </VStack>
            </div>
            <div className={styles.actions}>
              <UnstyledButton
                type="button"
                className={styles.closeButton}
                onClick={handleClear}
              >
                <CloseIcon style={{ width: 20, height: 20 }} />
              </UnstyledButton>
            </div>
          </div>
        ) : (
          <div className={cn(styles.contentLayer, styles.headerRow)}>
            <UIText kind="small/regular">{triggerTitle}</UIText>
            <ChevronRightIcon className={styles.chevron} />
          </div>
        )}
      </div>
      <ReceiverAddressDialog
        open={dialog.open}
        onClose={dialog.closeDialog}
        title={dialogTitle}
        predicate={predicate}
        validateMatch={validateMatch}
        onSelect={handleSelect}
      />
    </>
  );
}
