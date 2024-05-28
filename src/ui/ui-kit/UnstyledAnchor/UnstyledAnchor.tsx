import React from 'react';
import cx from 'classnames';
import * as s from './styles.module.css';

export const UnstyledAnchor = React.forwardRef(
  (
    { className, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>,
    ref: React.Ref<HTMLAnchorElement>
  ) => {
    return <a className={cx(className, s.anchor)} ref={ref} {...props} />;
  }
);
