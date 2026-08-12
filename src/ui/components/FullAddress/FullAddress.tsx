import React from 'react';
import cn from 'classnames';
import { UIText } from 'src/ui/ui-kit/UIText';
import type { Kind as UITextKind } from 'src/ui/ui-kit/UIText';
import * as styles from './FullAddress.module.css';

const TAIL_LENGTH = 6;

/**
 * Renders the whole address so that it can be verified against the source it
 * was copied from. When there isn't enough room for it, the head is ellipsized
 * and the last {@link TAIL_LENGTH} characters stay pinned — the tail is the
 * part people compare, so it must never be the part that gets cut.
 */
export function FullAddress({
  address,
  kind = 'caption/regular',
  color = 'var(--neutral-500)',
  className,
}: {
  address: string;
  kind?: UITextKind;
  color?: string;
  className?: string;
}) {
  const head = address.slice(0, -TAIL_LENGTH);
  const tail = address.slice(-TAIL_LENGTH);

  return (
    <div className={cn(styles.row, className)} title={address}>
      <UIText kind={kind} color={color} className={styles.head}>
        {head}
      </UIText>
      <UIText kind={kind} color={color} className={styles.tail}>
        {tail}
      </UIText>
    </div>
  );
}
