import React, { useRef } from 'react';
import * as helperStyles from 'src/ui/style/helpers.module.css';
import { useCustomValidity } from './useCustomValidity';

export function HiddenValidationInput({
  customValidity,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { customValidity: string }) {
  const ref = useRef<HTMLInputElement>(null);
  useCustomValidity({ customValidity, ref });
  return (
    <input
      ref={ref}
      className={helperStyles.visuallyHiddenInput}
      style={{ placeSelf: 'center' }}
      type="readonly"
      {...props}
    />
  );
}
