import React from 'react';
import cn from 'classnames';
import type { LinkProps } from 'react-router-dom';
import { UnstyledLink } from '../UnstyledLink';
import { UnstyledAnchor } from '../UnstyledAnchor';
import { UnstyledButton } from '../UnstyledButton';
import * as styles from './styles.module.css';

export const ListItemLink = React.forwardRef(
  (
    { className, style, ...props }: LinkProps,
    ref: React.Ref<HTMLAnchorElement>
  ) => {
    return (
      <UnstyledLink
        ref={ref}
        style={{ color: 'inherit', ...style }}
        className={cn(styles.item, 'parent-hover', className)}
        {...props}
      />
    );
  }
);

export const ListItemAnchor = React.forwardRef(
  (
    {
      className,
      style,
      ...props
    }: React.AnchorHTMLAttributes<HTMLAnchorElement>,
    ref: React.Ref<HTMLAnchorElement>
  ) => {
    return (
      <UnstyledAnchor
        ref={ref}
        style={{ color: 'inherit', ...style }}
        className={cn(styles.item, 'parent-hover', className)}
        {...props}
      />
    );
  }
);

export const ListItemButton = React.forwardRef(
  (
    {
      className,
      style,
      ...props
    }: React.ButtonHTMLAttributes<HTMLButtonElement>,
    ref: React.Ref<HTMLButtonElement>
  ) => {
    return (
      <UnstyledButton
        ref={ref}
        style={{ color: 'inherit', ...style }}
        className={cn(styles.item, 'parent-hover', className)}
        {...props}
      />
    );
  }
);
