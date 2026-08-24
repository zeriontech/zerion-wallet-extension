import React from 'react';
import {
  getQuestBackgroundForAddress,
  getQuestPatternBackground,
  QUEST_GRADIENTS,
} from 'src/ui/shared/questBackground';
import * as styles from './styles.module.css';

/**
 * The quest-card background, seeded by the address so a wallet's receive
 * screen is the same colour every time it opens. Covers the whole page — see
 * `styles.module.css` for how it stays behind the content and the URL bar.
 */
export function AddressBackground({ address }: { address: string }) {
  const { pattern, gradient } = getQuestBackgroundForAddress(address);

  return (
    <div className={styles.background} aria-hidden={true}>
      <div
        className={styles.backgroundGradient}
        style={{ background: QUEST_GRADIENTS[gradient] }}
      />
      <div
        className={styles.backgroundPattern}
        style={{ background: getQuestPatternBackground(pattern) }}
      />
    </div>
  );
}
