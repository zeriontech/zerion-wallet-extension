import React, {
  ComponentPropsWithoutRef,
  ComponentPropsWithRef,
  ElementType,
} from 'react';
import cx from 'classnames';
import * as s from './styles.module.css';

export const textParams = {
  // [font-size, line-height, weight, letter-spacing]
  'headline/hero': [40, 48, 500, '-0.5px'],
  'headline/h1': [36, 48, 500, '-0.25px'],
  'headline/h2': [24, 28, 500, 'normal'],
  'headline/h3': [20, 24, 500, 'normal'],
  'body/accent': [16, 24, 500, '0.25px'],
  'body/regular': [16, 24, 400, '0.1px'],
  'small/accent': [14, 20, 500, '0.3px'],
  'small/regular': [14, 20, 400, '0.2px'],
  'caption/accent': [12, 16, 500, '0.38px'],
  'caption/regular': [12, 16, 400, '0.38px'],
} as const;

export type Kind = keyof typeof textParams;

const getStyles = (kind: Kind) => {
  const result = textParams[kind];
  if (!result) {
    throw new Error(`Unsupported text kind: ${kind}`);
  }
  return result;
};

export interface Props {
  inline?: boolean;
  kind: Kind;
  color?: string;
}

const UITextComponent = <As extends ElementType = 'div'>(
  {
    as,
    inline = false,
    kind,
    color = 'currentColor',
    className,
    style,
    ...props
  }: Props & { as?: As } & ComponentPropsWithoutRef<As> & {
      ref?: ComponentPropsWithRef<As>['ref'];
    },
  ref: React.Ref<ComponentPropsWithRef<As>['ref']>
) => {
  const [fontSize, lineHeight, fontWeight, letterSpacing] = getStyles(kind);
  return React.createElement(as || 'div', {
    ref,
    className: cx(className, s.uitext),
    style: {
      display: inline ? 'inline-block' : undefined,
      fontSize,
      lineHeight: `${lineHeight}px`,
      fontWeight,
      letterSpacing,
      color,
      ...style,
    },
    ...props,
  });
};

export const UIText = React.forwardRef(
  UITextComponent
) as typeof UITextComponent;
