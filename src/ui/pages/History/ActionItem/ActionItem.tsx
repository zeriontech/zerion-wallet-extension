import React, { useCallback, useMemo, useRef, useState } from 'react';
import type { AddressAction } from 'defi-sdk';
import { animated, useSpring } from 'react-spring';
import { useNetworks } from 'src/modules/networks/useNetworks';
import { CircleSpinner } from 'src/ui/ui-kit/CircleSpinner';
import { Media } from 'src/ui/ui-kit/Media';
import { UIText } from 'src/ui/ui-kit/UIText';
import FailedIcon from 'jsx:src/ui/assets/failed.svg';
import LinkIcon from 'jsx:src/ui/assets/new-window.svg';
import ArrowLeftIcon from 'jsx:src/ui/assets/arrow-left.svg';
import type { Networks } from 'src/modules/networks/Networks';
import { createChain } from 'src/modules/networks/Chain';
import { HStack } from 'src/ui/ui-kit/HStack';
import { VStack } from 'src/ui/ui-kit/VStack';
import { TextAnchor } from 'src/ui/ui-kit/TextAnchor';
import { useAddressParams } from 'src/ui/shared/user-address/useAddressParams';
import { NetworkIcon } from 'src/ui/components/NetworkIcon';
import ZerionIcon from 'jsx:src/ui/assets/zerion-squircle.svg';
import { DNA_MINT_CONTRACT_ADDRESS } from 'src/ui/components/DnaClaim/dnaAddress';
import { normalizeAddress } from 'src/shared/normalizeAddress';
import type {
  AnyAddressAction,
  PendingAddressAction,
} from 'src/modules/ethereum/transactions/addressAction';
import {
  getActionAddress,
  getActionAsset,
  isPendingAddressAction,
} from 'src/modules/ethereum/transactions/addressAction';
import { getFungibleAsset } from 'src/modules/ethereum/transactions/actionAsset';
import { truncateAddress } from 'src/ui/shared/truncateAddress';
import { BottomSheetDialog } from 'src/ui/ui-kit/ModalDialogs/BottomSheetDialog';
import type { HTMLDialogElementInterface } from 'src/ui/ui-kit/ModalDialogs/HTMLDialogElementInterface';
import { Button } from 'src/ui/ui-kit/Button';
import { UnstyledButton } from 'src/ui/ui-kit/UnstyledButton';
import { showConfirmDialog } from 'src/ui/ui-kit/ModalDialogs/showConfirmDialog';
import { openInNewWindow } from 'src/ui/shared/openInNewWindow';
import { ActionDetailedView } from '../ActionDetailedView/ActionDetailedView';
import { AssetLink } from '../ActionDetailedView/components/AssetLink';
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
  networks,
}: {
  action: AnyAddressAction;
  networks: Networks;
}) {
  const [showLinkIcon, setShowLinkIcon] = useState(false);
  const linkIconStyle = useSpring({
    display: 'flex',
    x: showLinkIcon ? 0 : -10,
    opacity: showLinkIcon ? 1 : 0,
    config: { tension: 300, friction: 15 },
  });
  const { chain: chainStr } = action.transaction;
  const chain = chainStr ? createChain(chainStr) : null;

  const explorerHref = chain
    ? networks.getExplorerTxUrlByName(chain, action.transaction.hash)
    : null;

  const isMintingDna = checkIsDnaMint(action);
  const titlePrefix = action.transaction.status === 'failed' ? 'Failed ' : '';
  const actionTitle = isMintingDna
    ? 'Mint DNA'
    : `${titlePrefix}${action.type.display_value}`;
  return (
    <UIText kind="body/accent">
      {explorerHref ? (
        <TextAnchor
          href={explorerHref}
          target="_blank"
          title={explorerHref}
          rel="noopener noreferrer"
          onMouseEnter={() => setShowLinkIcon(true)}
          onMouseLeave={() => setShowLinkIcon(false)}
          onClick={(e) => {
            e.stopPropagation();
            openInNewWindow(e);
          }}
          style={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          <HStack gap={2} alignItems="center">
            {actionTitle}
            <animated.div style={linkIconStyle}>
              <LinkIcon style={{ width: 16, height: 16 }} />
            </animated.div>
          </HStack>
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

function ActionItemBackend({
  action,
  networks,
}: {
  action: AddressAction;
  networks: Networks;
}) {
  const [showDetailedView, setShowDetailedView] = useState(false);
  const { params, ready } = useAddressParams();
  const dialogRef = useRef<HTMLDialogElementInterface | null>(null);

  const handleDialogOpen = useCallback<React.MouseEventHandler>((e) => {
    e.stopPropagation();
    if (!dialogRef.current) {
      return;
    }
    setShowDetailedView(true);
    showConfirmDialog(dialogRef.current).then(() => setShowDetailedView(false));
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
      <HStack
        className={styles.actionItem}
        gap={24}
        justifyContent="space-between"
        style={{
          position: 'relative',
          height: 42,
          gridTemplateColumns:
            'minmax(min-content, max-content) minmax(100px, max-content)',
        }}
        alignItems="center"
        onClick={handleDialogOpen}
      >
        <UnstyledButton
          className={styles.actionItemBackdropButton}
          onClick={handleDialogOpen}
        />
        <Media
          vGap={0}
          gap={12}
          style={{ zIndex: 1 }}
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
          text={<ActionTitle action={action} networks={networks} />}
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
              />
            ) : outgoingTransfers?.length && chain ? (
              <HistoryItemValue
                transfers={outgoingTransfers}
                direction="out"
                chain={chain}
                address={address}
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
                />
              ) : null}
            </UIText>
          ) : null}
        </VStack>
      </HStack>
      <BottomSheetDialog
        ref={dialogRef}
        style={{
          height: '100vh',
          borderRadius: 0,
          padding: 16,
          backgroundColor: 'var(--neutral-100)',
        }}
      >
        <form
          method="dialog"
          style={{ position: 'absolute', top: 16, left: 8 }}
        >
          <Button
            kind="ghost"
            value="cancel"
            size={40}
            style={{ width: 40, padding: 8 }}
          >
            <ArrowLeftIcon />
          </Button>
        </form>
        {showDetailedView ? (
          <ActionDetailedView
            action={action}
            networks={networks}
            address={address}
          />
        ) : null}
      </BottomSheetDialog>
    </>
  );
}

function ActionItemLocal({
  action,
  networks,
}: {
  action: PendingAddressAction;
  networks: Networks;
}) {
  const asset = getActionAsset(action);

  const { params, ready } = useAddressParams();

  if (!ready) {
    return null;
  }

  const address = 'address' in params ? params.address : undefined;

  const isMintingDna = checkIsDnaMint(action);

  return (
    <HStack
      gap={24}
      justifyContent="space-between"
      style={{ height: 42 }}
      alignItems="center"
    >
      <Media
        vGap={0}
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
        text={<ActionTitle action={action} networks={networks} />}
        detailText={<ActionDetail networks={networks} action={action} />}
      />
      <UIText kind="small/regular">
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
  );
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
  return isPendingAddressAction(addressAction) ? (
    <ActionItemLocal action={addressAction} networks={networks} />
  ) : (
    <ActionItemBackend action={addressAction} networks={networks} />
  );
}
