import React from 'react';
import { CURRENCIES, CurrencyType } from 'src/modules/currency/currencies';

export function NeutralDecimals({
  parts,
  neutralColor = 'var(--neutral-500)',
  currency,
}: {
  parts: Intl.NumberFormatPart[];
  neutralColor?: string;
  currency: string;
}) {
  return (
    <>
      {parts.map((part, index) => (
        <span
          key={index}
          style={
            (part.type === 'decimal' || part.type === 'fraction') &&
            CURRENCIES[currency].type !== CurrencyType.Crypto
              ? { color: neutralColor }
              : undefined
          }
        >
          {part.value}
        </span>
      ))}
    </>
  );
}
