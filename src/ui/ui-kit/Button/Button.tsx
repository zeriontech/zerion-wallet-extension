import React, {
  ComponentPropsWithoutRef,
  ComponentPropsWithRef,
  ElementType,
} from 'react';
import cx from 'classnames';
import { UIText } from '../UIText';
import * as styles from './styles.module.css';

const asButtonStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  textAlign: 'center',
};

type Kind = 'primary' | 'regular' | 'ghost';
type Size = 60 | 56 | 44 | 36 | 32 | 28;

const kinds: { [kind in Kind]: (size: number) => React.CSSProperties } = {
  primary: () => ({
    background: 'var(--actions-default)',
    color: 'white',
  }),
  regular: () => ({
    background: 'var(--white)',
    color: 'var(--black)',
    border: '1px solid var(--neutral-300)',
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
  }: Props & { as?: As } & ComponentPropsWithoutRef<As> &
    Partial<Pick<ComponentPropsWithRef<As>, 'ref'>>,
  ref: React.Ref<ComponentPropsWithRef<As>['ref']>
) => {
  const isButton = as === 'button';
  return (
    <UIText
      as={as || 'button'}
      ref={ref}
      kind="button/m_med"
      className={cx(className, styles[kind])}
      style={Object.assign(
        {
          cursor: 'pointer',
          border: 'none',
          textDecoration: 'none',
          paddingLeft: 48,
          paddingRight: 48,
          borderRadius: 8,
          height: size,
        },
        kinds[kind](size),
        isButton ? undefined : asButtonStyle,
        style
      )}
      {...props}
    >
      {children}
    </UIText>
  );
};

export const Button = React.forwardRef(ButtonElement) as typeof ButtonElement;
