import React from 'react';
import cn from 'classnames';
import type { LinkProps } from 'react-router-dom';
import { UnstyledLink } from '../UnstyledLink';
import { UnstyledAnchor } from '../UnstyledAnchor';
import { UnstyledButton } from '../UnstyledButton';
import * as styles from './styles.module.css';

export const FrameListItem = React.forwardRef(
  (
    { className, style, ...props }: React.HTMLAttributes<HTMLDivElement>,
    ref: React.Ref<HTMLDivElement>
  ) => {
    return (
      <div
        ref={ref}
        style={{ color: 'inherit', ...style }}
        className={cn(styles.item, className)}
        {...props}
      />
    );
  }
);

export const FrameListItemLink = React.forwardRef(
  (
    { className, style, ...props }: LinkProps,
    ref: React.Ref<HTMLAnchorElement>
  ) => {
    return (
      <UnstyledLink
        ref={ref}
        style={{ color: 'inherit', ...style }}
        className={cn(styles.item, className)}
        {...props}
      />
    );
  }
);

export const FrameListItemAnchor = React.forwardRef(
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
        className={cn(styles.item, className)}
        {...props}
      />
    );
  }
);

export const FrameListItemButton = React.forwardRef(
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
        className={cn(styles.item, className)}
        {...props}
      />
    );
  }
);
