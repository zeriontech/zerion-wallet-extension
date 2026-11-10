import React from 'react';
import cx from 'classnames';
import type { LinkProps } from 'react-router';
import { Link } from 'react-router';
import * as s from '../TextAnchor/styles.module.css';

export function TextLink({ className, ...props }: LinkProps) {
  return <Link className={cx(s.anchor, className)} {...props} />;
}
