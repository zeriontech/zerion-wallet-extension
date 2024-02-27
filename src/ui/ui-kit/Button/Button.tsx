import type {
  ComponentPropsWithoutRef,
  ComponentPropsWithRef,
  ElementType,
} from 'react';
import React from 'react';
import cx from 'classnames';
import { UIText } from '../UIText';
import * as styles from './styles.module.css';

export type Kind =
  | 'primary'
  | 'regular'
  | 'neutral'
  | 'ghost'
  | 'danger'
  | 'warning'
  | 'loading-border'
  | 'text-primary';
type Size = 60 | 56 | 48 | 44 | 40 | 36 | 32 | 28;

const borderRaduis: Record<Size, number> = {
  '28': 8,
  '32': 8,
  '36': 12,
  '40': 12,
  '44': 16,
  '48': 16,
  '56': 20,
  '60': 20,
};

const kinds: { [kind in Kind]: (size: number) => React.CSSProperties } = {
  primary: () => ({ paddingInline: 48 }),
  danger: () => ({}),
  warning: () => ({}),
  regular: () => ({}),
  neutral: () => ({}),
  ghost: (size) => {
    const padding = size <= 44 ? 4 : 8;
    return { paddingLeft: padding, paddingRight: padding };
  },
  'text-primary': () => ({ height: 'auto', borderRadius: 0 }),
  'loading-border': () => ({ border: '2px solid transparent' }),
};

interface Props {
  kind?: Kind;
  size?: Size;
}

const ButtonElement = <As extends ElementType = 'button'>(
  {
    style,
    as,
    kind = 'primary',
    size = 44,
    children,
    className,
    ...props
  }: Props & { as?: As } & ComponentPropsWithoutRef<As> & {
      ref?: ComponentPropsWithRef<As>['ref'];
    },
  ref: React.Ref<ComponentPropsWithRef<As>['ref']>
) => {
  const isButton = as == null || as === 'button';
  return (
    <UIText
      as={as || 'button'}
      ref={ref}
      kind="small/accent"
      className={cx(className, styles[kind], styles.button, {
        [styles.asButton]: !isButton,
      })}
      style={Object.assign(
        {
          border: 'none',
          textDecoration: 'none',
          borderRadius: borderRaduis[size],
          height: size,
          color: undefined,
        },
        kinds[kind](size),
        style
      )}
      {...props}
    >
      {children}
    </UIText>
  );
};

export const Button = React.forwardRef(ButtonElement) as typeof ButtonElement;
