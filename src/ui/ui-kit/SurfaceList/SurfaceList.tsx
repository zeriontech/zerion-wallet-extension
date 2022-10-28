import React from 'react';
import { LinkProps } from 'react-router-dom';
import { Surface } from '../Surface/Surface';
import { UnstyledAnchor } from '../UnstyledAnchor';
import { UnstyledButton } from '../UnstyledButton';
import { UnstyledLink } from '../UnstyledLink';
import { VStack } from '../VStack';
import * as s from './styles.module.css';

export function ItemLink({
  to,
  onClick,
  children,
  style,
}: {
  to: LinkProps['to'];
  children: React.ReactNode;
  onClick?: React.AnchorHTMLAttributes<HTMLAnchorElement>['onClick'];
  style?: React.CSSProperties;
}) {
  return (
    <UnstyledLink
      style={{ color: 'inherit', ...style }}
      to={to}
      onClick={onClick}
      className={s.option}
    >
      <div className={s.decoration}>{children}</div>
    </UnstyledLink>
  );
}

export function ItemAnchor({
  href,
  target,
  onClick,
  children,
  style,
}: {
  href: string;
  target?: React.AnchorHTMLAttributes<HTMLAnchorElement>['target'];
  children: React.ReactNode;
  onClick?: React.AnchorHTMLAttributes<HTMLAnchorElement>['onClick'];
  style?: React.CSSProperties;
}) {
  return (
    <UnstyledAnchor
      style={{ color: 'inherit', ...style }}
      href={href}
      target={target}
      onClick={onClick}
      className={s.option}
    >
      <div className={s.decoration}>{children}</div>
    </UnstyledAnchor>
  );
}

export function ItemButton({
  children,
  style,
  ...props
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <UnstyledButton
      style={{ color: 'inherit', ...style }}
      className={s.option}
      {...props}
    >
      <div className={s.decoration}>{children}</div>
    </UnstyledButton>
  );
}

export interface Item {
  key: string | number;
  component: JSX.Element;
  to?: LinkProps['to'];
  href?: string;
  target?: React.AnchorHTMLAttributes<HTMLAnchorElement>['target'];
  isInteractive?: boolean;
  onClick?: React.ButtonHTMLAttributes<HTMLButtonElement>['onClick'];
  style?: React.CSSProperties;
  separatorTop?: boolean;
  separatorLeadingInset?: number;
  pad?: boolean;
}

export function SurfaceList({
  items,
  style,
}: {
  items: Item[];
  style?: React.CSSProperties;
}) {
  const vGap = 12;
  return (
    <Surface style={style}>
      <VStack gap={0}>
        {items.map((item, index) => {
          const {
            style,
            separatorTop = true,
            separatorLeadingInset = 0,
            pad = true,
          } = item;
          const isInteractiveItem =
            item.isInteractive ?? Boolean(item.to || item.href || item.onClick);
          const component = item.to ? (
            <ItemLink
              to={item.to}
              onClick={
                item.onClick as React.AnchorHTMLAttributes<HTMLAnchorElement>['onClick']
              }
            >
              {item.component}
            </ItemLink>
          ) : item.href ? (
            <ItemAnchor
              href={item.href}
              target={item.target}
              onClick={
                item.onClick as React.AnchorHTMLAttributes<HTMLAnchorElement>['onClick']
              }
            >
              {item.component}
            </ItemAnchor>
          ) : item.onClick ? (
            <ItemButton onClick={item.onClick}>{item.component}</ItemButton>
          ) : pad === false ? (
            item.component
          ) : (
            <div style={{ paddingTop: vGap, paddingBottom: vGap }}>
              {item.component}
            </div>
          );
          if (item.key == null) {
            throw new Error('No key');
          }
          return (
            <div
              key={item.key}
              style={{
                padding: isInteractiveItem ? undefined : `0 16px`,
                ...style,
              }}
            >
              {index > 0 && separatorTop ? (
                <div
                  style={{
                    height: 1,
                    marginLeft:
                      (isInteractiveItem ? 16 : 0) + separatorLeadingInset,
                    marginRight: isInteractiveItem ? 16 : 0,
                    backgroundColor: 'var(--neutral-300)',
                  }}
                />
              ) : null}
              {component}
            </div>
          );
        })}
      </VStack>
    </Surface>
  );
}
