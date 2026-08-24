import React from 'react';
import cn from 'classnames';
import { UIText } from 'src/ui/ui-kit/UIText';
import { VStack } from 'src/ui/ui-kit/VStack';
import * as styles from './Callout.module.css';

/**
 * An inline advisory card — the thing that says "no providers support this
 * purchase" without taking over the screen.
 *
 * The visual language is lifted from `SwapForm2/TransactionWarning`, which is
 * presentation-identical but coupled to that form's `WarningContent` type. That
 * copy is deliberately left alone; migrating it onto this component would mean
 * re-QAing the swap form for no user-visible change.
 */
export function Callout({
  kind = 'notice',
  title,
  description,
}: {
  kind?: 'notice' | 'negative';
  title?: React.ReactNode;
  description: React.ReactNode;
}) {
  return (
    <div
      className={cn(styles.card, kind === 'negative' ? styles.negative : null)}
    >
      <VStack gap={title ? 8 : 0}>
        {title ? (
          <UIText kind="small/accent" color="currentColor">
            {title}
          </UIText>
        ) : null}
        <UIText kind="small/regular" color="currentColor">
          {description}
        </UIText>
      </VStack>
    </div>
  );
}
