import React, { useCallback, useMemo, useRef } from 'react';
import { useNetworks } from 'src/modules/networks/useNetworks';
import { CircleSpinner } from 'src/ui/ui-kit/CircleSpinner';
import { Media } from 'src/ui/ui-kit/Media';
import { UIText } from 'src/ui/ui-kit/UIText';
import FailedIcon from 'jsx:src/ui/assets/failed.svg';
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
  AnyAction,
  LocalAction,
} from 'src/modules/ethereum/transactions/addressAction';
import {
  getActionAddress,
  getActionAsset,
} from 'src/modules/ethereum/transactions/addressAction';
import { truncateAddress } from 'src/ui/shared/truncateAddress';
import type { HTMLDialogElementInterface } from 'src/ui/ui-kit/ModalDialogs/HTMLDialogElementInterface';
import { UnstyledButton } from 'src/ui/ui-kit/UnstyledButton';
import { prepareForHref } from 'src/ui/shared/prepareForHref';
import { AssetLink } from 'src/ui/components/AssetLink';
import { DNA_MINT_CONTRACT_ADDRESS } from 'src/ui/DNA/shared/constants';
import { isInteractiveElement } from 'src/ui/shared/isInteractiveElement';
import { useCurrency } from 'src/modules/currency/useCurrency';
import type { Action } from 'src/modules/zerion-api/requests/wallet-get-actions';
import { useNavigate } from 'react-router-dom';
import { AccelerateTransactionDialog } from '../AccelerateTransactionDialog';
import {
  HistoryApprovalValue,
  HistoryItemValue,
  HistoryNFTValue,
  HistoryTokenValue,
  TransactionCurrencyValue,
} from './TransactionItemValue';
import {
  HistoryAssetIcon,
  transactionIconStyle,
  TransactionItemIcon,
  TRANSACTION_ICON_SIZE,
} from './TransactionTypeIcon';
import * as styles from './styles.module.css';

function checkIsDnaMint(action: AnyAction) {
  return (
    normalizeAddress(action.label?.contract?.address || '') ===
    DNA_MINT_CONTRACT_ADDRESS
  );
}

function ActionTitle({
  action,
  explorerUrl,
}: {
  action: AnyAction;
  explorerUrl?: string | null;
}) {
  const isMintingDna = checkIsDnaMint(action);
  const titlePrefix = action.status === 'failed' ? 'Failed ' : '';
  const actionTitle = isMintingDna
    ? 'Mint DNA'
    : `${titlePrefix}${action.type.displayValue}`;

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

function ActionLabel({ action }: { action: AnyAction }) {
  const address = getActionAddress(action);
  const text =
    action.label?.wallet?.name ||
    action.label?.contract?.dapp.name ||
    action.label?.displayTitle;
  if (text && text !== address) {
    return (
      <span title={text} style={{ whiteSpace: 'nowrap' }}>
        {text}
      </span>
    );
  } else if (address) {
    return <AddressTruncated value={address} />;
  } else if (action.transaction) {
    return <AddressTruncated value={action.transaction.hash} />;
  }
  return null;
}

function ActionDetail({ action }: { action: AnyAction }) {
  const chainInfo = action.transaction?.chain;

  return (
    <HStack alignItems="center" gap={4}>
      <NetworkIcon
        size={16}
        src={chainInfo?.iconUrl}
        name={chainInfo?.name || null}
      />
      <UIText kind="small/regular" color="var(--neutral-500)">
        {action.status === 'pending' ? (
          <span style={{ color: 'var(--notice-500)' }}>Pending</span>
        ) : action.status === 'failed' ? (
          <span style={{ color: 'var(--negative-500)' }}>Failed</span>
        ) : action.status === 'dropped' ? (
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
  testnetMode,
}: {
  action: Action;
  testnetMode: boolean;
}) {
  const { currency } = useCurrency();
  const navigate = useNavigate();

  const incomingTransfers = useMemo(
    () =>
      action.content?.transfers?.filter(
        (transfer) => transfer.direction === 'in'
      ),
    [action.content?.transfers]
  );
  const outgoingTransfers = useMemo(
    () =>
      action.content?.transfers?.filter(
        (transfer) => transfer.direction === 'out'
      ),
    [action.content?.transfers]
  );
  const approvals = useMemo(() => action.content?.approvals || [], [action]);

  const shouldUsePositiveColor = incomingTransfers?.length === 1;

  return (
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
        navigate(`/action/${action.id}`, { state: { action } });
      }}
    >
      <UnstyledButton
        className={styles.actionItemBackdropButton}
        onClick={(e) => {
          e.stopPropagation();
          navigate(`/action/${action.id}`, { state: { action } });
        }}
      />
      <Media
        vGap={0}
        gap={12}
        image={
          action.status === 'failed' ? (
            <FailedIcon style={transactionIconStyle} />
          ) : action.status === 'pending' ? (
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
        detailText={<ActionDetail action={action} />}
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
          {incomingTransfers?.length ? (
            <HistoryItemValue
              actionType={action.type.value}
              transfers={incomingTransfers}
              withLink={!testnetMode}
            />
          ) : outgoingTransfers?.length ? (
            <HistoryItemValue
              actionType={action.type.value}
              transfers={outgoingTransfers}
              withLink={!testnetMode}
            />
          ) : approvals.length ? (
            <HistoryApprovalValue
              approvals={approvals}
              withLink={!testnetMode}
            />
          ) : null}
        </UIText>
        <UIText kind="small/regular" color="var(--neutral-500)">
          {incomingTransfers?.length && !outgoingTransfers?.length ? (
            <TransactionCurrencyValue
              transfers={incomingTransfers}
              currency={currency}
            />
          ) : outgoingTransfers?.length && !incomingTransfers?.length ? (
            <TransactionCurrencyValue
              transfers={outgoingTransfers}
              currency={currency}
            />
          ) : outgoingTransfers?.length ? (
            <HistoryItemValue
              actionType={action.type.value}
              transfers={outgoingTransfers}
              withLink={false}
            />
          ) : approvals.length === 1 && approvals[0].unlimited ? (
            'Unlimited'
          ) : approvals.length === 1 ? (
            approvals[0].nft ? (
              <HistoryNFTValue
                nft={approvals[0].nft}
                amount={approvals[0].amount}
                direction={null}
                withLink={false}
              />
            ) : approvals[0].fungible ? (
              <HistoryTokenValue
                fungible={approvals[0].fungible}
                amount={approvals[0].amount}
                direction={null}
                actionType="approve"
                withLink={false}
              />
            ) : null
          ) : null}
        </UIText>
      </VStack>
    </HStack>
  );
}

function ActionItemLocal({
  action,
  networks,
}: {
  action: LocalAction;
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
          detailText={<ActionDetail action={action} />}
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
  addressAction: AnyAction;
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
      action={addressAction as Action}
      testnetMode={testnetMode}
    />
  );
}
