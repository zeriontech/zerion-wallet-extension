import React from 'react';
import { LinkProps, Link } from 'react-router-dom';
import cx from 'classnames';
import * as s from './styles.module.css';

export function UnstyledLink({ className, ...props }: LinkProps) {
  return <Link className={cx(className, s.anchor)} {...props} />;
}
