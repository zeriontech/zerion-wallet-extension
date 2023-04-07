import type { ReactNode, HTMLProps } from 'react';
import React, { createContext, useContext } from 'react';
import cx from 'classnames';
import { NavLink } from 'react-router-dom';
import type { NavLinkProps } from 'react-router-dom';
import type { Kind as UITextKind } from 'src/ui/ui-kit/UIText';
import { UIText } from 'src/ui/ui-kit/UIText';
import * as s from './SegmentedControl.module.css';

export const kinds = ['primary', 'secondary'] as const;

type Kind = typeof kinds[number];

const labelParams: Record<
  Kind,
  { checked: string; blurred: string; kind: UITextKind }
> = {
  primary: {
    checked: 'var(--primary)',
    blurred: 'var(--neutral-600)',
    kind: 'body/accent',
  },
  secondary: {
    checked: 'var(--black)',
    blurred: 'var(--black)',
    kind: 'caption/accent',
  },
};

const SegmentedControlGroupContext = createContext<{
  kind: Kind;
}>({ kind: 'primary' });

export function SegmentedControlRadio({
  name,
  value,
  checked,
  onChange,
  children,
}: HTMLProps<HTMLInputElement>) {
  const { kind } = useContext(SegmentedControlGroupContext);
  return (
    <label className={s.radio}>
      <UIText
        kind={labelParams[kind].kind}
        color={checked ? labelParams[kind].checked : labelParams[kind].blurred}
      >
        {children}
      </UIText>
      <input
        type="radio"
        className={s.input}
        name={name}
        value={value}
        checked={checked}
        onChange={onChange}
      />
      <div className={s.activeDecorator} />
    </label>
  );
}

export function SegmentedControlLink({
  children,
  style,
  textKind,
  ...props
}: NavLinkProps & { textKind?: UITextKind; children: React.ReactNode }) {
  const { kind: groupKind } = useContext(SegmentedControlGroupContext);
  return (
    <NavLink
      {...props}
      className={({ isActive }) => cx(s.link, { [s.activeLink]: isActive })}
      style={({ isActive }) => ({
        color: isActive
          ? labelParams[groupKind].checked
          : labelParams[groupKind].blurred,
        ...style,
      })}
    >
      <UIText kind={textKind || labelParams[groupKind].kind}>{children}</UIText>
      <div className={s.activeDecorator} />
    </NavLink>
  );
}

interface SegmentedControlGroupProps extends HTMLProps<HTMLDivElement> {
  children: ReactNode;
  kind?: Kind;
  childrenLayout?: 'spread-children-evenly' | 'start';
}

export function SegmentedControlGroup({
  kind = 'primary',
  childrenLayout = 'spread-children-evenly',
  children,
  ...props
}: SegmentedControlGroupProps) {
  return (
    <div
      className={cx(s.wrap, s[kind], {
        [s.spreadChildrenEvenly]: childrenLayout === 'spread-children-evenly',
      })}
      {...props}
    >
      <SegmentedControlGroupContext.Provider value={{ kind }}>
        {children}
      </SegmentedControlGroupContext.Provider>
    </div>
  );
}
