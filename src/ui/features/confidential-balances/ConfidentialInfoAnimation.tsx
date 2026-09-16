import React from 'react';
import cx from 'classnames';
import { formatTokenValue } from 'src/shared/units/formatTokenValue';
import * as styles from './ConfidentialInfoAnimation.module.css';

/** Illustrative balances — the picture, not anyone's real holdings */
const ROWS = [
  { symbol: 'USDC', value: 4210, coin: styles.coinUsdc },
  { symbol: 'ETH', value: 0.5821, coin: styles.coinEth },
  { symbol: 'USDT', value: 1000, coin: styles.coinUsdt },
] as const;

function Rows({ className }: { className: string }) {
  return (
    <div className={cx(styles.layer, styles.rows, className)}>
      {ROWS.map(({ symbol, value, coin }) => (
        <div key={symbol} className={styles.row}>
          <span className={styles.token}>
            <span className={cx(styles.coin, coin)} />
            {symbol}
          </span>
          <span>{formatTokenValue(value, '').trim()}</span>
        </div>
      ))}
    </div>
  );
}

/**
 * "Decrypting balances" illustration for the explainer hovercard. A full-width
 * flat stage; the animation is CSS-only and scales with the stage width.
 * Purely decorative — hidden from assistive tech.
 */
export function ConfidentialInfoAnimation({
  className,
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      aria-hidden={true}
      className={cx(styles.stage, className)}
      style={style}
    >
      <Rows className={styles.ghost} />
      <Rows className={styles.crisp} />
      <div className={cx(styles.layer, styles.beam)} />
    </div>
  );
}
