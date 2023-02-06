import React from 'react';
import cx from 'classnames';
import { textParams } from 'src/ui/ui-kit/UIText/UIText';
import * as s from './styles.module.css';

const [fontSize, lineHeight, fontWeight, letterSpacing] =
  textParams['body/regular'];
const inputFontStyle = {
  fontSize,
  lineHeight: `${lineHeight}px`,
  fontWeight,
  letterSpacing,
};

const InputComponent = (
  { style, className, ...props }: React.InputHTMLAttributes<HTMLInputElement>,
  ref: React.Ref<HTMLInputElement>
) => {
  return (
    <input
      ref={ref}
      className={cx(className, s.input)}
      {...props}
      style={{
        ...inputFontStyle,
        ...style,
      }}
    />
  );
};

export const Input = React.forwardRef(InputComponent);
