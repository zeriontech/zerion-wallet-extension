import React from 'react';
import cx from 'classnames';
import * as styles from './styles.module.css';

type ControlledToggleProps = React.InputHTMLAttributes<HTMLInputElement>;

export function Toggle({ className, ...rest }: ControlledToggleProps) {
  return (
    <label className={cx(styles.label, className)}>
      <input
        type="checkbox"
        {...rest}
        className={cx(styles.input, styles.visuallyHidden)}
      />
      <div className={styles.decorator}>
        <div className={styles.circle} />
      </div>
    </label>
  );
}
