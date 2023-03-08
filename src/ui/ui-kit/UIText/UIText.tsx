import React, {
  ComponentPropsWithoutRef,
  ComponentPropsWithRef,
  ElementType,
} from 'react';
import cx from 'classnames';
import * as s from './styles.module.css';

export const textParams = {
  // [font-size, line-height, weight, letter-spacing]
  'button/l_reg': [16, 20, 400, 'normal'],
  'button/l_med': [16, 20, 500, 'normal'],
  'button/m_reg': [14, 20, 400, 'normal'],
  'button/m_med': [14, 20, 500, 'normal'],
  'button/s_reg': [12, 20, 400, 'normal'],
  'button/s_med': [12, 20, 500, 'normal'],
  'subtitle/s_reg': [13, 16, 400, '-0.2px'],
  'subtitle/s_med': [13, 16, 500, '-0.2px'],
  'subtitle/m_reg': [14, 16, 400, '-0.2px'],
  'subtitle/m_med': [14, 16, 500, '-0.2px'],
  'subtitle/l_reg': [16, 20, 400, '-0.4px'],
  'subtitle/l_med': [16, 20, 500, '-0.6px'],
  'h/1_sb': [40, 48, 600, '-1px'],
  'h/1_reg': [40, 48, 400, 'normal'],
  'h/1_med': [40, 48, 500, '-1.8px'],
  'h/2_sb': [36, 44, 600, '-1px'],
  'h/2_reg': [36, 44, 400, 'normal'],
  'h/2_med': [36, 44, 500, '-1px'],
  'h/3_med': [32, 40, 500, 'normal'],
  'h/4_sb': [28, 32, 600, '-0.4px'],
  'h/4_med': [28, 32, 500, '-0.4px'],
  'h/5_sb': [24, 28, 600, '-0.5px'],
  'h/5_reg': [24, 28, 400, 'normal'],
  'h/5_med': [24, 28, 500, 'normal'],
  'h/6_sb': [20, 24, 600, 'normal'],
  'h/6_reg': [20, 24, 400, 'normal'],
  'h/6_med': [20, 24, 500, '-0.4px'],
  'caption/reg': [12, 16, 400, '-0.2px'],
  'caption/med': [12, 16, 500, 'normal'],
  'body/s_reg': [14, 20, 400, 'normal'],
  'body/s_med': [14, 20, 500, 'normal'],
  'label/reg': [11, 12, 400, 'normal'],
  'label/med': [11, 12, 500, 'normal'],
  'label/s_med': [11, 12, 500, 'normal'],

  /** Updated naming scheme */
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
