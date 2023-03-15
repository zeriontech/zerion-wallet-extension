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
  {
    style,
    className,
    boxHeight = 44,
    error = false,
    ...props
  }: {
    boxHeight?: 40 | 44;
    error?: boolean;
  } & React.InputHTMLAttributes<HTMLInputElement>,
  ref: React.Ref<HTMLInputElement>
) => {
  return (
    <input
      ref={ref}
      className={cx(className, s.input, {
        [s.height40]: boxHeight === 40,
        [s.error]: error,
      })}
      {...props}
      style={{
        ...inputFontStyle,
        ...style,
      }}
    />
  );
};

export const Input = React.forwardRef(InputComponent);
