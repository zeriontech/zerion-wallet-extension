import React, { Fragment } from 'react';
import { VStack } from 'src/ui/ui-kit/VStack';
import { UIText } from 'src/ui/ui-kit/UIText';
import { TextAnchor } from 'src/ui/ui-kit/TextAnchor';
import { splitDappPlaceholder } from '../shared/dappReferral';
import type { WarningContent } from './resolveTransactionWarning';
import * as styles from './TransactionWarning.module.css';

const GENERIC_DAPP_NAME = 'the dApp';

/** A backend-authored message, with `${DAPP}` rendered as a DApp Referral. */
function BackendMessage({
  message,
  dapp,
}: {
  message: string;
  dapp: WarningContent['dapp'];
}) {
  return splitDappPlaceholder(message, dapp).map((part, index) => {
    if (part.kind === 'text') {
      return <Fragment key={index}>{part.text}</Fragment>;
    }
    const label = part.label ?? GENERIC_DAPP_NAME;
    return part.href ? (
      <TextAnchor
        key={index}
        href={part.href}
        target="_blank"
        rel="noopener noreferrer"
        style={{ textDecoration: 'underline' }}
      >
        {label}
      </TextAnchor>
    ) : (
      <Fragment key={index}>{label}</Fragment>
    );
  });
}

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
            {warning.dapp ? (
              <BackendMessage
                message={warning.description}
                dapp={warning.dapp}
              />
            ) : (
              warning.description
            )}
          </UIText>
        ) : null}
      </VStack>
    </div>
  );
}
