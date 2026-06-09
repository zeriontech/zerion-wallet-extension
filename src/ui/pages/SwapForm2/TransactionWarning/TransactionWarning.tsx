import React from 'react';
import { VStack } from 'src/ui/ui-kit/VStack';
import { UIText } from 'src/ui/ui-kit/UIText';
import type { WarningContent } from './resolveTransactionWarning';
import * as styles from './TransactionWarning.module.css';

/**
 * Presentation-only. The decision of which warning to show (or none) lives in
 * `resolveTransactionWarning`, called once in `SwapForm2`.
 */
export function TransactionWarning({
  warning,
}: {
  warning: WarningContent | null;
}) {
  if (!warning) return null;

  return (
    <div
      className={
        warning.variant === 'error'
          ? `${styles.card} ${styles.cardError}`
          : styles.card
      }
    >
      <VStack gap={warning.description ? 8 : 0}>
        <UIText kind="small/accent" color="currentColor">
          {warning.title}
        </UIText>
        {warning.description ? (
          <UIText kind="small/regular" color="currentColor">
            {warning.description}
          </UIText>
        ) : null}
      </VStack>
    </div>
  );
}
