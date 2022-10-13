import React from 'react';
import { textParams } from 'src/ui/ui-kit/UIText/UIText';

const [fontSize, lineHeight, fontWeight, letterSpacing] =
  textParams['body/regular'];
const inputFontStyle = {
  fontSize,
  lineHeight: `${lineHeight}px`,
  fontWeight,
  letterSpacing,
};

const InputComponent = (
  { style, ...props }: React.InputHTMLAttributes<HTMLInputElement>,
  ref: React.Ref<HTMLInputElement>
) => {
  return (
    <input
      ref={ref}
      {...props}
      style={{
        ...inputFontStyle,
        backgroundColor: 'var(--neutral-200)',
        padding: '10px 12px',
        border: '1px solid var(--neutral-200)',
        borderRadius: 8,
        ...style,
      }}
    />
  );
};

export const Input = React.forwardRef(InputComponent);
