import React from 'react';

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
  kind: Kind;
  color?: string;
  inline?: boolean;
}

export function UIText({
  as = 'div',
  inline = false,
  kind,
  color = 'currentColor',
  style,
  ...props
}: {
  as?: 'div' | 'span' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  inline?: boolean;
  kind: Kind;
  color?: string;
} & React.HTMLProps<HTMLDivElement>) {
  const [fontSize, lineHeight, fontWeight, letterSpacing] = getStyles(kind);
  const Element = as;
  return (
    <Element
      style={{
        display: inline ? 'inline' : 'block',
        margin: 0,
        fontFamily: 'Graphik, sans-serif',
        fontSize,
        lineHeight: `${lineHeight}px`,
        fontWeight,
        letterSpacing,
        color,
        ...style,
      }}
      {...props}
    />
  );
}
