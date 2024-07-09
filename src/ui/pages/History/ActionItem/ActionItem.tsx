import React, { useCallback, useMemo, useRef } from 'react';
import type { AddressAction } from 'defi-sdk';
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
import { TextAnchor } from 'src/ui/ui-kit/TextAnchor';
import { useAddressParams } from 'src/ui/shared/user-address/useAddressParams';
import { NetworkIcon } from 'src/ui/components/NetworkIcon';
import ZerionIcon from 'jsx:src/ui/assets/zerion-squircle.svg';
import { normalizeAddress } from 'src/shared/normalizeAddress';
import type {
  AnyAddressAction,
  LocalAddressAction,
} from 'src/modules/ethereum/transactions/addressAction';
import {
  getActionAddress,
  getActionAsset,
} from 'src/modules/ethereum/transactions/addressAction';
import { getFungibleAsset } from 'src/modules/ethereum/transactions/actionAsset';
import { truncateAddress } from 'src/ui/shared/truncateAddress';
import type { HTMLDialogElementInterface } from 'src/ui/ui-kit/ModalDialogs/HTMLDialogElementInterface';
import { Button } from 'src/ui/ui-kit/Button';
import { UnstyledButton } from 'src/ui/ui-kit/UnstyledButton';
import { KeyboardShortcut } from 'src/ui/components/KeyboardShortcut';
import { CenteredDialog } from 'src/ui/ui-kit/ModalDialogs/CenteredDialog';
import { prepareForHref } from 'src/ui/shared/prepareForHref';
import { AssetLink } from 'src/ui/components/AssetLink';
import { DNA_MINT_CONTRACT_ADDRESS } from 'src/ui/DNA/shared/constants';
import { isInteractiveElement } from 'src/ui/shared/isInteractiveElement';
import { useCurrency } from 'src/modules/currency/useCurrency';
import { ActionDetailedView } from '../ActionDetailedView';
import { isUnlimitedApproval } from '../isUnlimitedApproval';
import { AccelerateTransactionDialog } from '../AccelerateTransactionDialog';
import {
  HistoryItemValue,
  TransactionCurrencyValue,
} from './TransactionItemValue';
import {
  HistoryAssetIcon,
  transactionIconStyle,
  TransactionItemIcon,
  TRANSACTION_ICON_SIZE,
} from './TransactionTypeIcon';
import * as styles from './styles.module.css';

function checkIsDnaMint(action: AnyAddressAction) {
  return (
    normalizeAddress(action.label?.value || '') === DNA_MINT_CONTRACT_ADDRESS
  );
}

function ActionTitle({
  action,
  explorerUrl,
}: {
  action: AnyAddressAction;
  explorerUrl?: string | null;
}) {
  const isMintingDna = checkIsDnaMint(action);
  const titlePrefix = action.transaction.status === 'failed' ? 'Failed ' : '';
  const actionTitle = isMintingDna
    ? 'Mint DNA'
    : `${titlePrefix}${action.type.display_value}`;

  const explorerUrlPrepared = useMemo(
    () => (explorerUrl ? prepareForHref(explorerUrl)?.toString() : undefined),
    [explorerUrl]
  );

  return (
    <UIText kind="body/accent">
      {explorerUrl ? (
        <TextAnchor
          href={explorerUrlPrepared}
          title={explorerUrlPrepared}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {actionTitle}
        </TextAnchor>
      ) : (
        actionTitle
      )}
    </UIText>
  );
}

function AddressTruncated({ value }: { value: string }) {
  return (
    <span title={value} style={{ whiteSpace: 'nowrap' }}>
      {truncateAddress(value, 5)}
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

function ActionItemBackend({
  action,
  networks,
  testnetMode,
}: {
  action: AddressAction;
  networks: Networks;
  testnetMode: boolean;
}) {
  const { currency } = useCurrency();
  const { params, ready } = useAddressParams();
  const dialogRef = useRef<HTMLDialogElementInterface | null>(null);

  const handleDialogOpen = useCallback(() => {
    dialogRef.current?.showModal();
  }, []);

  const handleDialogDismiss = useCallback(() => {
    dialogRef.current?.close();
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
          cursor: 'pointer',
          position: 'relative',
          height: 42,
          gridTemplateColumns:
            'minmax(min-content, max-content) minmax(100px, max-content)',
        }}
        alignItems="center"
        onClick={(event) => {
          if (isInteractiveElement(event.target)) {
            return;
          }
          handleDialogOpen();
        }}
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
          image={
            action.transaction.status === 'failed' ? (
              <FailedIcon style={transactionIconStyle} />
            ) : action.transaction.status === 'pending' ? (
              <CircleSpinner
                size="38px"
                trackWidth="7%"
                color="var(--primary)"
                style={{
                  position: 'absolute',
                  top: -1,
                  left: -1,
                }}
              />
            ) : (
              <TransactionItemIcon action={action} />
            )
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
                withLink={!testnetMode}
              />
            ) : outgoingTransfers?.length && chain ? (
              <HistoryItemValue
                transfers={outgoingTransfers}
                direction="out"
                chain={chain}
                address={address}
                withLink={!testnetMode}
              />
            ) : null}
          </UIText>
          {chain ? (
            <UIText kind="small/regular" color="var(--neutral-500)">
              {incomingTransfers?.length && !outgoingTransfers?.length ? (
                <TransactionCurrencyValue
                  transfers={incomingTransfers}
                  chain={chain}
                  currency={currency}
                />
              ) : outgoingTransfers?.length && !incomingTransfers?.length ? (
                <TransactionCurrencyValue
                  transfers={outgoingTransfers}
                  chain={chain}
                  currency={currency}
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
        renderWhenOpen={() => (
          <>
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
            <ActionDetailedView
              action={action}
              networks={networks}
              address={address}
            />
          </>
        )}
      ></CenteredDialog>
    </>
  );
}

function ActionItemLocal({
  action,
  networks,
}: {
  action: LocalAddressAction;
  networks: Networks;
}) {
  const asset = getActionAsset(action);

  const { params, ready } = useAddressParams();

  const dialogRef = useRef<HTMLDialogElementInterface | null>(null);

  const handleDialogOpen = useCallback(() => {
    dialogRef.current?.showModal();
  }, []);

  if (!ready) {
    return null;
  }

  const address = 'address' in params ? params.address : undefined;

  const isMintingDna = checkIsDnaMint(action);

  const { chain: chainStr } = action.transaction;
  const chain = chainStr ? createChain(chainStr) : null;

  const explorerUrl = chain
    ? networks.getExplorerTxUrlByName(chain, action.transaction.hash)
    : null;

  const isPending = action.transaction.status === 'pending';

  return (
    <>
      {isPending ? (
        <AccelerateTransactionDialog
          ref={dialogRef}
          action={action}
          onDismiss={() => dialogRef.current?.close()}
        />
      ) : null}
      <HStack
        className={isPending ? styles.actionItem : undefined}
        gap={24}
        justifyContent="space-between"
        style={{ position: 'relative', height: 42 }}
        alignItems="center"
        onClick={
          isPending
            ? (event) => {
                if (isInteractiveElement(event.target)) {
                  return;
                }
                handleDialogOpen();
              }
            : undefined
        }
      >
        {isPending ? (
          <UnstyledButton
            className={styles.actionItemBackdropButton}
            onClick={(e) => {
              e.stopPropagation();
              handleDialogOpen();
            }}
          />
        ) : null}
        <Media
          vGap={0}
          gap={12}
          image={
            <div style={{ position: 'relative', ...transactionIconStyle }}>
              {isPending ? (
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
              {isMintingDna ? (
                <ZerionIcon
                  width={TRANSACTION_ICON_SIZE}
                  height={TRANSACTION_ICON_SIZE}
                />
              ) : (
                <HistoryAssetIcon
                  size={TRANSACTION_ICON_SIZE}
                  asset={asset ? { fungible: asset } : undefined}
                  type={action.type.value}
                />
              )}
            </div>
          }
          text={<ActionTitle action={action} explorerUrl={explorerUrl} />}
          detailText={<ActionDetail networks={networks} action={action} />}
        />
        <UIText kind="body/regular">
          {asset ? (
            <AssetLink
              asset={asset}
              title={
                action.type.value === 'approve'
                  ? asset.name || asset.symbol?.toUpperCase()
                  : undefined
              }
              address={address}
            />
          ) : null}
        </UIText>
      </HStack>
    </>
  );
}

export function ActionItem({
  addressAction,
  testnetMode,
}: {
  addressAction: AnyAddressAction;
  testnetMode: boolean;
}) {
  const { networks } = useNetworks();

  if (!networks || !addressAction) {
    return null;
  }
  return 'local' in addressAction && addressAction.local ? (
    <ActionItemLocal action={addressAction} networks={networks} />
  ) : (
    <ActionItemBackend
      action={addressAction as AddressAction}
      networks={networks}
      testnetMode={testnetMode}
    />
  );
}
