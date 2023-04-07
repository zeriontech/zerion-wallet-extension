import React from 'react';
import cx from 'classnames';
import { Link, LinkProps } from 'react-router-dom';
import * as s from '../TextAnchor/styles.module.css';

export function TextLink({ className, ...props }: LinkProps) {
  return <Link className={cx(s.anchor, className)} {...props} />;
}
