import React from 'react';
import cx from 'classnames';
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
