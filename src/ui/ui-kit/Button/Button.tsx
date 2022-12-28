import React, {
  ComponentPropsWithoutRef,
  ComponentPropsWithRef,
  ElementType,
} from 'react';
import cx from 'classnames';
import { UIText } from '../UIText';
import * as styles from './styles.module.css';

type Kind = 'primary' | 'regular' | 'ghost' | 'danger';
type Size = 60 | 56 | 46 | 44 | 40 | 36 | 32 | 28;

const kinds: { [kind in Kind]: (size: number) => React.CSSProperties } = {
  primary: () => ({}),
  danger: () => ({}),
  regular: () => ({
    background: 'transparent',
    color: 'var(--black)',
    border: '1px solid var(--neutral-400)',
  }),
  ghost: (size) => {
    const padding = size <= 44 ? 4 : 8;
    return { paddingLeft: padding, paddingRight: padding };
  },
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
      kind="button/m_med"
      className={cx(className, styles[kind], styles.button, {
        [styles.asButton]: !isButton,
      })}
      style={Object.assign(
        {
          border: 'none',
          textDecoration: 'none',
          paddingLeft: 48,
          paddingRight: 48,
          borderRadius: 8,
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
