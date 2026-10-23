import React from 'react';
import { useNavigate } from 'react-router-dom';
import type { PendingAction } from 'src/modules/zerion-api/requests/wallet-get-actions';
import { getPendingStatus } from 'src/ui/features/pending-transactions/getPendingStatus';
import { getPendingStatusLabel } from 'src/ui/features/pending-transactions/getPendingStatusLabel';
import { NetworkIcon } from 'src/ui/components/NetworkIcon';
import { usePreferences } from 'src/ui/features/preferences';
import { isInteractiveElement } from 'src/ui/shared/isInteractiveElement';
import { CircleSpinner } from 'src/ui/ui-kit/CircleSpinner';
import { HStack } from 'src/ui/ui-kit/HStack';
import { Media } from 'src/ui/ui-kit/Media';
import { UIText } from 'src/ui/ui-kit/UIText';
import { UnstyledButton } from 'src/ui/ui-kit/UnstyledButton';
import { ActionItemValue } from './ActionItem/ActionItem';
import { TransactionItemIcon } from './ActionItem/TransactionTypeIcon';
import * as styles from './ActionItem/styles.module.css';

export function isPendingAction(value: object): value is PendingAction {
  return 'pendingActionId' in value;
}

function getPendingChain(item: PendingAction) {
  return item.transaction?.chain ?? item.acts.at(0)?.transaction.chain ?? null;
}

export function PendingStatusLine({
  item,
  nowMs,
}: {
  item: PendingAction;
  nowMs: number;
}) {
  const kind = getPendingStatus(item, nowMs).kind;
  return (
    <span
      style={{
        color:
          kind === 'readyToSign'
            ? 'var(--primary)'
            : kind === 'inProgress' || kind === 'broadcasted'
            ? 'var(--notice-500)'
            : undefined,
      }}
    >
      {getPendingStatusLabel(item, nowMs)}
    </span>
  );
}

export function PendingActionItem({
  item,
  nowMs,
  actions,
}: {
  item: PendingAction;
  nowMs: number;
  actions?: React.ReactNode;
}): JSX.Element {
  const navigate = useNavigate();
  const { preferences } = usePreferences();
  const testnetMode = Boolean(preferences?.testnetMode?.on);
  const chain = getPendingChain(item);
  const openActionInfo = () =>
    navigate(`/action/${encodeURIComponent(item.id)}`, {
      state: { addressAction: item },
    });

  return (
    <HStack
      className={styles.actionItem}
      gap={24}
      justifyContent="space-between"
      style={{
        cursor: 'pointer',
        position: 'relative',
        height: 42,
        gridTemplateColumns: actions
          ? 'minmax(min-content, max-content) minmax(60px, max-content) auto'
          : 'minmax(min-content, max-content) minmax(100px, max-content)',
      }}
      alignItems="center"
      onClick={(event) => {
        if (isInteractiveElement(event.target)) {
          return;
        }
        openActionInfo();
      }}
    >
      <UnstyledButton
        className={styles.actionItemBackdropButton}
        onClick={(event) => {
          event.stopPropagation();
          openActionInfo();
        }}
      />
      <Media
        vGap={0}
        gap={12}
        image={
          item.status === 'pending' ? (
            <CircleSpinner size="38px" trackWidth="7%" color="var(--primary)" />
          ) : (
            <TransactionItemIcon addressAction={item} />
          )
        }
        text={<UIText kind="body/accent">{item.type.displayValue}</UIText>}
        detailText={
          <HStack alignItems="center" gap={4}>
            <NetworkIcon
              size={16}
              src={chain?.iconUrl}
              name={chain?.name || null}
            />
            <UIText
              kind="small/regular"
              color="var(--neutral-500)"
              style={{ display: 'flex' }}
            >
              <PendingStatusLine item={item} nowMs={nowMs} />
            </UIText>
          </HStack>
        }
      />
      <ActionItemValue
        actionType={item.type.value}
        content={item.content}
        testnetMode={testnetMode}
      />
      {actions ? <div style={{ display: 'flex' }}>{actions}</div> : null}
    </HStack>
  );
}
