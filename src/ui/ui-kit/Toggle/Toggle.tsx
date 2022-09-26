import React, { useState } from 'react';
import cx from 'classnames';
import * as styles from './styles.module.css';

interface ControlledToggleProps
  extends Omit<
    React.HTMLAttributes<HTMLButtonElement>,
    'onChange' | 'defaultValue'
  > {
  value?: boolean;
  onChange?(value: boolean): void;
}

export function ControlledToggle({
  className,
  onChange,
  value,
  ...rest
}: ControlledToggleProps) {
  return (
    <button
      {...rest}
      className={cx(styles.button, className, {
        [styles.checked]: value,
      })}
      onClick={() => {
        onChange?.(!value);
      }}
    >
      <div className={styles.circle} />
    </button>
  );
}

interface ToggleProps extends Omit<ControlledToggleProps, 'value'> {
  defaultValue?: boolean;
}

export function Toggle({ defaultValue, onChange, ...rest }: ToggleProps) {
  const [checked, setChecked] = useState(Boolean(defaultValue));

  return (
    <ControlledToggle
      {...rest}
      value={checked}
      onChange={(value) => {
        setChecked(value);
        onChange?.(value);
      }}
    />
  );
}
