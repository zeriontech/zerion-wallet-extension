import React from 'react';
import LockIcon from 'jsx:src/ui/assets/lock-outline.svg';
import ChevronRightIcon from 'jsx:src/ui/assets/chevron-right.svg';
import { HStack } from 'src/ui/ui-kit/HStack';
import { VStack } from 'src/ui/ui-kit/VStack';
import { UIText } from 'src/ui/ui-kit/UIText';
import { UnstyledButton } from 'src/ui/ui-kit/UnstyledButton';
import { ConfidentialInfoHovercard } from './ConfidentialInfoHovercard';
import { openRevealDialog } from './revealDialogStore';
import * as styles from './styles.module.css';

/**
 * The Confidential Balances panel: the primary entry point to the Reveal
 * Dialog, placed after the Wallet positions group on the Overview. The caller
 * decides whether to show it (the wallet is Locked and Signable). Hovering
 * it shows the explainer card.
 */
export function ConfidentialBalancesPanel({
  address,
  style,
}: {
  address: string;
  style?: React.CSSProperties;
}) {
  return (
    <ConfidentialInfoHovercard placement="bottom" anchorStyle={style}>
      <UnstyledButton
        type="button"
        className={styles.panel}
        onClick={() => openRevealDialog({ address, trigger: 'panel' })}
      >
        <HStack
          gap={12}
          alignItems="center"
          style={{ gridTemplateColumns: 'auto 1fr auto', textAlign: 'left' }}
        >
          <LockIcon
            style={{
              display: 'block',
              width: 24,
              height: 24,
              color: 'var(--neutral-500)',
            }}
          />
          <VStack gap={0}>
            <UIText kind="body/accent">Confidential Balances</UIText>
            <UIText kind="caption/regular" color="var(--neutral-500)">
              Some tokens in this wallet are encrypted onchain.
            </UIText>
          </VStack>
          <ChevronRightIcon
            style={{
              display: 'block',
              width: 20,
              height: 20,
              color: 'var(--neutral-500)',
            }}
          />
        </HStack>
      </UnstyledButton>
    </ConfidentialInfoHovercard>
  );
}
