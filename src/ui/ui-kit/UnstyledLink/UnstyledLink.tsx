import React from 'react';
import { LinkProps, Link } from 'react-router-dom';
import cx from 'classnames';
import * as s from './styles.module.css';

export const UnstyledLink = React.forwardRef(
  (
    { className, ...props }: LinkProps,
    ref: React.ForwardedRef<HTMLAnchorElement>
  ) => {
    return <Link ref={ref} className={cx(className, s.anchor)} {...props} />;
  }
);
