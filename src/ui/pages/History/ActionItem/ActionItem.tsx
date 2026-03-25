import React, { useMemo } from 'react';
import { CircleSpinner } from 'src/ui/ui-kit/CircleSpinner';
import { Media } from 'src/ui/ui-kit/Media';
import { UIText } from 'src/ui/ui-kit/UIText';
import FailedIcon from 'jsx:src/ui/assets/failed.svg';
import { HStack } from 'src/ui/ui-kit/HStack';
import { VStack } from 'src/ui/ui-kit/VStack';
import { TextAnchor } from 'src/ui/ui-kit/TextAnchor';
import { NetworkIcon } from 'src/ui/components/NetworkIcon';
import { normalizeAddress } from 'src/shared/normalizeAddress';
import type { AnyAddressAction } from 'src/modules/ethereum/transactions/addressAction';
import { truncateAddress } from 'src/ui/shared/truncateAddress';
import { UnstyledButton } from 'src/ui/ui-kit/UnstyledButton';
import { prepareForHref } from 'src/ui/shared/prepareForHref';
import { DNA_MINT_CONTRACT_ADDRESS } from 'src/ui/DNA/shared/constants';
import { isInteractiveElement } from 'src/ui/shared/isInteractiveElement';
import { useCurrency } from 'src/modules/currency/useCurrency';
import { useNavigate } from 'react-router-dom';
import { BlurrableBalance } from 'src/ui/components/BlurrableBalance';
import {
  HistoryApprovalValue,
  HistoryItemValue,
  HistoryNFTValue,
  HistoryTokenValue,
  TransactionCurrencyValue,
} from './TransactionItemValue';
import {
  transactionIconStyle,
  TransactionItemIcon,
} from './TransactionTypeIcon';
import * as styles from './styles.module.css';

function checkIsDnaMint(action: AnyAddressAction) {
  return (
    normalizeAddress(action.label?.contract?.address || '') ===
    DNA_MINT_CONTRACT_ADDRESS
  );
}

function ActionTitle({
  addressAction,
  explorerUrl,
}: {
  addressAction: AnyAddressAction;
  explorerUrl?: string | null;
}) {
  const isMintingDna = checkIsDnaMint(addressAction);
  const titlePrefix = addressAction.status === 'failed' ? 'Failed ' : '';
  const actionTitle = isMintingDna
    ? 'Mint DNA'
    : `${titlePrefix}${addressAction.type.displayValue}`;

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

function ActionLabel({ addressAction }: { addressAction: AnyAddressAction }) {
  const address =
    addressAction.label?.wallet?.address ||
    addressAction.label?.contract?.address;

  const text =
    addressAction.label?.wallet?.name ||
    addressAction.label?.contract?.dapp.name;

  if (text && text !== address) {
    return (
      <span title={text} style={{ whiteSpace: 'nowrap' }}>
        {text}
      </span>
    );
  } else if (address) {
    return <AddressTruncated value={address} />;
  } else if (addressAction.transaction?.hash) {
    return <AddressTruncated value={addressAction.transaction.hash} />;
  }
  return null;
}

function ActionDetail({ addressAction }: { addressAction: AnyAddressAction }) {
  const chainInfo = addressAction.transaction?.chain;

  return (
    <HStack alignItems="center" gap={4}>
      <NetworkIcon
        size={16}
        src={chainInfo?.iconUrl}
        name={chainInfo?.name || null}
      />
      <UIText
        kind="small/regular"
        color="var(--neutral-500)"
        style={{ display: 'flex' }}
      >
        {addressAction.status === 'pending' ? (
          <span style={{ color: 'var(--notice-500)' }}>Pending</span>
        ) : addressAction.status === 'failed' ? (
          <span style={{ color: 'var(--negative-500)' }}>Failed</span>
        ) : addressAction.status === 'dropped' ? (
          <span style={{ color: 'var(--negative-500)' }}>Dropped</span>
        ) : (
          <BlurrableBalance kind="small/regular">
            <ActionLabel addressAction={addressAction} />
          </BlurrableBalance>
        )}
      </UIText>
    </HStack>
  );
}

export function ActionItem({
  addressAction,
  testnetMode,
}: {
  addressAction: AnyAddressAction;
  testnetMode: boolean;
}) {
  const { currency } = useCurrency();
  const navigate = useNavigate();

  const incomingTransfers = useMemo(
    () =>
      addressAction.content?.transfers?.filter(
        (transfer) => transfer.direction === 'in'
      ),
    [addressAction.content?.transfers]
  );
  const outgoingTransfers = useMemo(
    () =>
      addressAction.content?.transfers?.filter(
        (transfer) => transfer.direction === 'out'
      ),
    [addressAction.content?.transfers]
  );
  const approvals = useMemo(
    () => addressAction.content?.approvals || [],
    [addressAction]
  );

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
        navigate(`/action/${addressAction.id}`, { state: { addressAction } });
      }}
    >
      <UnstyledButton
        className={styles.actionItemBackdropButton}
        onClick={(e) => {
          e.stopPropagation();
          navigate(`/action/${addressAction.id}`, { state: { addressAction } });
        }}
      />
      <Media
        vGap={0}
        gap={12}
        image={
          addressAction.status === 'failed' ? (
            <FailedIcon style={transactionIconStyle} />
          ) : addressAction.status === 'pending' ? (
            <CircleSpinner size="38px" trackWidth="7%" color="var(--primary)" />
          ) : (
            <TransactionItemIcon addressAction={addressAction} />
          )
        }
        text={<ActionTitle addressAction={addressAction} />}
        detailText={<ActionDetail addressAction={addressAction} />}
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
              actionType={addressAction.type.value}
              transfers={incomingTransfers}
              withLink={!testnetMode}
              kind="body/regular"
            />
          ) : outgoingTransfers?.length ? (
            <HistoryItemValue
              actionType={addressAction.type.value}
              transfers={outgoingTransfers}
              withLink={!testnetMode}
              kind="body/regular"
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
              kind="small/regular"
            />
          ) : outgoingTransfers?.length && !incomingTransfers?.length ? (
            <TransactionCurrencyValue
              transfers={outgoingTransfers}
              currency={currency}
              kind="small/regular"
            />
          ) : outgoingTransfers?.length ? (
            <HistoryItemValue
              actionType={addressAction.type.value}
              transfers={outgoingTransfers}
              withLink={false}
              kind="small/regular"
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
                kind="small/regular"
              />
            ) : approvals[0].fungible ? (
              <HistoryTokenValue
                fungible={approvals[0].fungible}
                amount={approvals[0].amount}
                direction={null}
                actionType="approve"
                withLink={false}
                kind="small/regular"
              />
            ) : null
          ) : null}
        </UIText>
      </VStack>
    </HStack>
  );
}
