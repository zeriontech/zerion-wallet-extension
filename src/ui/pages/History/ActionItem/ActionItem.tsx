import React, { useCallback, useMemo, useRef, useState } from 'react';
import type { AddressAction } from 'defi-sdk';
import { useQuery } from '@tanstack/react-query';
import { useNetworks } from 'src/modules/networks/useNetworks';
import { CircleSpinner } from 'src/ui/ui-kit/CircleSpinner';
import { Media } from 'src/ui/ui-kit/Media';
import { UIText } from 'src/ui/ui-kit/UIText';
import FailedIcon from 'jsx:src/ui/assets/failed.svg';
import ArrowLeftIcon from 'jsx:src/ui/assets/arrow-left.svg';
import type { Networks } from 'src/modules/networks/Networks';
import { createChain } from 'src/modules/networks/Chain';
import { HStack } from 'src/ui/ui-kit/HStack';
import { VStack } from 'src/ui/ui-kit/VStack';
import { useAddressParams } from 'src/ui/shared/user-address/useAddressParams';
import { NetworkIcon } from 'src/ui/components/NetworkIcon';
import type {
  AnyAddressAction,
  LocalAddressAction,
} from 'src/modules/ethereum/transactions/addressAction';
import { getActionAddress } from 'src/modules/ethereum/transactions/addressAction';
import { getFungibleAsset } from 'src/modules/ethereum/transactions/actionAsset';
import { truncateAddress } from 'src/ui/shared/truncateAddress';
import type { HTMLDialogElementInterface } from 'src/ui/ui-kit/ModalDialogs/HTMLDialogElementInterface';
import { Button } from 'src/ui/ui-kit/Button';
import { UnstyledButton } from 'src/ui/ui-kit/UnstyledButton';
import { KeyboardShortcut } from 'src/ui/components/KeyboardShortcut';
import { CenteredDialog } from 'src/ui/ui-kit/ModalDialogs/CenteredDialog';
import { AssetLink } from 'src/ui/components/AssetLink';
import { walletPort } from 'src/ui/shared/channels';
import { ActionDetailedView } from '../ActionDetailedView';
import { isUnlimitedApproval } from '../isUnlimitedApproval';
import {
  HistoryItemValue,
  TransactionCurrencyValue,
} from './TransactionItemValue';
import {
  transactionIconStyle,
  TransactionItemIcon,
  TRANSACTION_ICON_SIZE,
} from './TransactionTypeIcon';
import * as styles from './styles.module.css';
import { isDnaMintAction } from './helpers';

function ActionTitle({ action }: { action: AnyAddressAction }) {
  const isMintingDna = isDnaMintAction(action);
  const titlePrefix = action.transaction.status === 'failed' ? 'Failed ' : '';
  const actionTitle = isMintingDna
    ? 'Mint DNA'
    : `${titlePrefix}${action.type.display_value}`;

  return <UIText kind="body/accent">{actionTitle}</UIText>;
}

function AddressTruncated({ value }: { value: string }) {
  return (
    <span title={value} style={{ whiteSpace: 'nowrap' }}>
      {truncateAddress(value, 4)}
    </span>
  );
}

function ActionLabel({ action }: { action: AnyAddressAction }) {
  const address = getActionAddress(action);
  const text = action.label?.display_value.text;
  if (address) {
    return <AddressTruncated value={address} />;
  } else if (text) {
    return (
      <span title={text} style={{ whiteSpace: 'nowrap' }}>
        {text}
      </span>
    );
  } else {
    return <AddressTruncated value={action.transaction.hash} />;
  }
}

function ActionDetail({
  action,
  networks,
}: {
  action: AnyAddressAction;
  networks: Networks;
}) {
  const { chain: chainStr } = action.transaction;
  const chain = chainStr ? createChain(chainStr) : null;
  const network = useMemo(
    () => (chain ? networks.getNetworkByName(chain) : null),
    [chain, networks]
  );

  return (
    <HStack alignItems="center" gap={4}>
      <NetworkIcon
        size={16}
        src={network?.icon_url}
        chainId={network?.external_id || ''}
        name={network?.name || null}
      />
      <UIText kind="small/regular" color="var(--neutral-500)">
        {action.transaction.status === 'pending' ? (
          <span style={{ color: 'var(--notice-500)' }}>Pending</span>
        ) : action.transaction.status === 'failed' ? (
          <span style={{ color: 'var(--negative-500)' }}>Failed</span>
        ) : action.transaction.status === 'dropped' ? (
          <span style={{ color: 'var(--negative-500)' }}>Dropped</span>
        ) : (
          <ActionLabel action={action} />
        )}
      </UIText>
    </HStack>
  );
}

function ActionItemView({
  action,
  networks,
}: {
  action: AnyAddressAction;
  networks: Networks;
}) {
  const [showDetailedView, setShowDetailedView] = useState(false);
  const { params, ready } = useAddressParams();
  const dialogRef = useRef<HTMLDialogElementInterface | null>(null);

  const handleDialogOpen = useCallback(() => {
    if (!dialogRef.current) {
      return;
    }
    dialogRef.current.showModal();
    setShowDetailedView(true);
  }, []);

  const handleDialogDismiss = useCallback(() => {
    if (dialogRef.current) {
      dialogRef.current.close();
    }
    setShowDetailedView(false);
  }, []);

  if (!ready) {
    return null;
  }

  const address = 'address' in params ? params.address : undefined;
  const approveTransfers = action.content?.single_asset;
  const incomingTransfers = action.content?.transfers?.incoming;
  const outgoingTransfers = action.content?.transfers?.outgoing;

  const shouldUsePositiveColor =
    incomingTransfers?.length === 1 &&
    Boolean(getFungibleAsset(incomingTransfers[0].asset));
  const maybeApprovedAsset = getFungibleAsset(approveTransfers?.asset);
  const chain = action.transaction.chain
    ? createChain(action.transaction.chain)
    : null;

  return (
    <>
      <KeyboardShortcut
        combination="backspace"
        onKeyDown={handleDialogDismiss}
      />
      <HStack
        className={styles.actionItem}
        gap={24}
        justifyContent="space-between"
        style={{
          height: 42,
          gridTemplateColumns:
            'minmax(min-content, max-content) minmax(100px, max-content)',
        }}
        alignItems="center"
        onClick={handleDialogOpen}
      >
        <UnstyledButton
          className={styles.actionItemBackdropButton}
          onClick={(e) => {
            e.stopPropagation();
            handleDialogOpen();
          }}
        />
        <Media
          vGap={0}
          gap={12}
          style={{ zIndex: 1 }}
          image={
            <div style={{ position: 'relative', ...transactionIconStyle }}>
              {action.transaction.status === 'pending' ? (
                <CircleSpinner
                  size={`${TRANSACTION_ICON_SIZE + 2}px`}
                  trackWidth="7%"
                  color="var(--primary)"
                  style={{
                    position: 'absolute',
                    top: -1,
                    left: -1,
                  }}
                />
              ) : null}
              {action.transaction.status === 'failed' ? (
                <FailedIcon style={transactionIconStyle} />
              ) : (
                <TransactionItemIcon action={action} />
              )}
            </div>
          }
          text={<ActionTitle action={action} />}
          detailText={<ActionDetail networks={networks} action={action} />}
        />
        <VStack
          gap={0}
          style={{
            justifyItems: 'end',
            overflow: 'hidden',
            textAlign: 'left',
            zIndex: 1,
          }}
        >
          <UIText
            kind="body/regular"
            color={
              shouldUsePositiveColor ? 'var(--positive-500)' : 'var(--black)'
            }
            style={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxWidth: '100%',
            }}
          >
            {action.type.value === 'approve' && maybeApprovedAsset ? (
              <AssetLink
                asset={maybeApprovedAsset}
                title={
                  maybeApprovedAsset.name ||
                  maybeApprovedAsset.symbol?.toUpperCase()
                }
                address={address}
              />
            ) : incomingTransfers?.length && chain ? (
              <HistoryItemValue
                transfers={incomingTransfers}
                direction="in"
                chain={chain}
                address={address}
                withLink={true}
              />
            ) : outgoingTransfers?.length && chain ? (
              <HistoryItemValue
                transfers={outgoingTransfers}
                direction="out"
                chain={chain}
                address={address}
                withLink={true}
              />
            ) : null}
          </UIText>
          {chain ? (
            <UIText kind="small/regular" color="var(--neutral-500)">
              {incomingTransfers?.length && !outgoingTransfers?.length ? (
                <TransactionCurrencyValue
                  transfers={incomingTransfers}
                  chain={chain}
                />
              ) : outgoingTransfers?.length && !incomingTransfers?.length ? (
                <TransactionCurrencyValue
                  transfers={outgoingTransfers}
                  chain={chain}
                />
              ) : outgoingTransfers?.length ? (
                <HistoryItemValue
                  transfers={outgoingTransfers}
                  direction="out"
                  chain={chain}
                  address={address}
                  withLink={false}
                />
              ) : isUnlimitedApproval(
                  action.content?.single_asset?.quantity
                ) ? (
                'Unlimited'
              ) : action.content?.single_asset?.asset ? (
                <HistoryItemValue
                  transfers={[action.content.single_asset]}
                  direction="self"
                  chain={chain}
                  address={address}
                  withLink={false}
                />
              ) : null}
            </UIText>
          ) : null}
        </VStack>
      </HStack>
      <CenteredDialog
        ref={dialogRef}
        containerStyle={{ backgroundColor: 'var(--neutral-100)' }}
      >
        <Button
          kind="ghost"
          value="cancel"
          size={40}
          style={{
            width: 40,
            padding: 8,
            position: 'absolute',
            top: 16,
            left: 8,
          }}
          onClick={handleDialogDismiss}
        >
          <ArrowLeftIcon />
        </Button>
        {showDetailedView ? (
          <ActionDetailedView
            action={action}
            networks={networks}
            address={address}
          />
        ) : null}
      </CenteredDialog>
    </>
  );
}

function ActionItemLocalWrapper({
  action,
  networks,
}: {
  action: LocalAddressAction;
  networks: Networks;
}) {
  const { hash } = action.transaction;

  const { data: localInterpretation } = useQuery({
    queryKey: ['getLocalActionInterpretation', hash],
    queryFn: async () => {
      if (!hash) {
        return null;
      }
      const interpretation = await walletPort.request(
        'getLocalActionInterpretation',
        { hash }
      );
      if (interpretation) {
        interpretation.action.transaction.status = 'pending';
      }
      return interpretation;
    },
    suspense: false,
  });

  const displayedAction = localInterpretation?.action || action;

  return <ActionItemView action={displayedAction} networks={networks} />;
}

export function ActionItem({
  addressAction,
}: {
  addressAction: AnyAddressAction;
}) {
  const { networks } = useNetworks();

  if (!networks || !addressAction) {
    return null;
  }
  return 'local' in addressAction && addressAction.local ? (
    <ActionItemLocalWrapper action={addressAction} networks={networks} />
  ) : (
    <ActionItemView
      action={addressAction as AddressAction}
      networks={networks}
    />
  );
}
