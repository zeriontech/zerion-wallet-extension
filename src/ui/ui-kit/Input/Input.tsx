import React from 'react';
import cx from 'classnames';
import { useStore } from '@store-unit/react';
import { textParams } from 'src/ui/ui-kit/UIText/UIText';
import { ThemeStore, themeStore } from 'src/ui/features/appearance';
import * as s from './styles.module.css';

const [fontSize, lineHeight, fontWeight, letterSpacing] =
  textParams['body/regular'];

const inputFontStyle = {
  fontSize,
  lineHeight: `${lineHeight}px`,
  fontWeight,
  letterSpacing,
};

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  boxHeight?: 40 | 44;
  error?: boolean;
}

const InputComponent = (
  { style, className, boxHeight = 44, error = false, ...props }: InputProps,
  ref: React.Ref<HTMLInputElement>
) => {
  const themeState = useStore(themeStore);

  return (
    <input
      ref={ref}
      className={cx(className, s.input, {
        [s.height40]: boxHeight === 40,
        [s.error]: error,
        [s.darkTheme]: ThemeStore.isDark(themeState),
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
