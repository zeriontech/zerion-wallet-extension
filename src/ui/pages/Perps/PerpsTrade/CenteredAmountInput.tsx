import React, { useLayoutEffect, useRef, useState } from 'react';
import { UnstyledInput } from 'src/ui/ui-kit/UnstyledInput';
import * as s from './styles.module.css';

function getSizes(valueLength: number): {
  inputFontSize: number;
  dollarFontSize: number;
  dollarPaddingTop: number;
} {
  if (valueLength > 10) {
    return { inputFontSize: 32, dollarFontSize: 20, dollarPaddingTop: 6 };
  }
  if (valueLength > 8) {
    return { inputFontSize: 40, dollarFontSize: 24, dollarPaddingTop: 8 };
  }
  if (valueLength > 6) {
    return { inputFontSize: 52, dollarFontSize: 30, dollarPaddingTop: 10 };
  }
  return { inputFontSize: 64, dollarFontSize: 36, dollarPaddingTop: 12 };
}

export function CenteredAmountInput({
  value,
  placeholder = '0',
  autoFocus = true,
  onChange,
}: {
  value: string;
  placeholder?: string;
  autoFocus?: boolean;
  onChange: (next: string) => void;
}) {
  const mirrorRef = useRef<HTMLSpanElement | null>(null);
  const [inputWidth, setInputWidth] = useState(0);

  const isEmpty = value.length === 0;
  const measured = isEmpty ? placeholder : value;
  const { inputFontSize, dollarFontSize, dollarPaddingTop } = getSizes(
    measured.length
  );

  useLayoutEffect(() => {
    if (!mirrorRef.current) return;
    const w = mirrorRef.current.getBoundingClientRect().width;
    setInputWidth((prev) => (prev === w ? prev : w));
  }, [measured, inputFontSize]);

  return (
    <div className={s.amountFrame}>
      <div className={s.amountInputWrap}>
        <span
          aria-hidden
          className={s.amountLeadingSymbol}
          style={{
            fontSize: dollarFontSize,
            lineHeight: `${dollarFontSize}px`,
            paddingTop: dollarPaddingTop,
            color: isEmpty ? 'var(--neutral-500)' : 'var(--black)',
          }}
        >
          $
        </span>
        <span
          ref={mirrorRef}
          aria-hidden
          className={s.amountMirror}
          style={{
            fontSize: inputFontSize,
            lineHeight: `${inputFontSize}px`,
          }}
        >
          {measured}
        </span>
        <UnstyledInput
          inputMode="decimal"
          placeholder={placeholder}
          autoFocus={autoFocus}
          value={value}
          onChange={(e) => {
            const raw = e.currentTarget.value.replace(/[^\d.]/g, '');
            const parts = raw.split('.');
            const normalized =
              parts.length <= 1
                ? raw
                : `${parts[0]}.${parts.slice(1).join('')}`;
            onChange(normalized);
          }}
          className={s.amountInput}
          style={{
            fontSize: inputFontSize,
            lineHeight: `${inputFontSize}px`,
            width: Math.max(inputWidth, 1),
          }}
        />
      </div>
    </div>
  );
}
