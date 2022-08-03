import React from 'react';
import { Surface } from '../Surface/Surface';
import { UnstyledButton } from '../UnstyledButton';
import { UnstyledLink } from '../UnstyledLink';
import { VStack } from '../VStack';
import * as s from './styles.module.css';

function ItemLink({
  to,
  onClick,
  children,
}: {
  to: string;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <UnstyledLink
      style={{ color: 'inherit' }}
      to={to}
      onClick={onClick}
      className={s.option}
    >
      <div className={s.decoration}>{children}</div>
    </UnstyledLink>
  );
}

function ItemButton({
  onClick,
  children,
}: {
  onClick: React.ButtonHTMLAttributes<HTMLButtonElement>['onClick'];
  children: React.ReactNode;
}) {
  return (
    <UnstyledButton
      style={{ color: 'inherit' }}
      onClick={onClick}
      className={s.option}
    >
      <div className={s.decoration}>{children}</div>
    </UnstyledButton>
  );
}

export function SurfaceList({
  items,
  style,
}: {
  items: Array<{
    key: string | number;
    component: JSX.Element;
    to?: string;
    onClick?: React.ButtonHTMLAttributes<HTMLButtonElement>['onClick'];
  }>;
  style?: React.CSSProperties;
}) {
  const vGap = 12;
  return (
    <Surface style={{ padding: `0 16px`, ...style }}>
      <VStack gap={0}>
        {items.map((item, index) => {
          const component = item.to ? (
            <ItemLink to={item.to} onClick={item.onClick as any}>
              {item.component}
            </ItemLink>
          ) : item.onClick ? (
            <ItemButton onClick={item.onClick}>{item.component}</ItemButton>
          ) : (
            <div style={{ paddingTop: vGap, paddingBottom: vGap }}>
              {item.component}
            </div>
          );
          return (
            <React.Fragment key={item.key}>
              {index > 0 ? (
                <div
                  style={{ height: 1, backgroundColor: 'var(--neutral-300)' }}
                />
              ) : null}
              {component}
            </React.Fragment>
          );
        })}
      </VStack>
    </Surface>
  );
}
