import React from 'react';
import cx from 'classnames';
import CheckIcon from 'jsx:src/ui/assets/checkmark-checked.svg';
import s from './Radio.module.css';

type Props = React.InputHTMLAttributes<HTMLInputElement>;

export function Radio({ style, className, ...rest }: Props) {
  return (
    <label className={s.label} style={style}>
      <input type="radio" {...rest} className={s.input} />
      <span className={cx(s.decoration, className)} style={style} />
    </label>
  );
}

export function RadioCard({
  className,
  children,
  ...props
}: {
  defaultChecked?: boolean;
} & React.HTMLProps<HTMLInputElement>) {
  return (
    <label className={cx(className, s.label)}>
      <input type="radio" name="purchaseType" className={s.input} {...props} />
      <div className={s.cardDecoration}>
        {children}
        <div className={s.circle} />
        <CheckIcon className={s.checkedCircle} />
      </div>
    </label>
  );
}
