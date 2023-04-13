import React from 'react';
import { UIText } from 'src/ui/ui-kit/UIText';

export function Address({
  address,
  padding = 4,
  infixColor,
}: {
  address: string;
  padding?: number;
  infixColor?: string;
}) {
  const leadingPadding = address.startsWith('0x') ? 2 + padding : padding;
  const prefix = address.slice(0, leadingPadding);
  const infix = address.slice(leadingPadding, -padding);
  const suffix = address.slice(-padding);

  return (
    <UIText kind="small/regular">
      <UIText kind="small/accent" inline={true}>
        {prefix}
      </UIText>
      <span style={{ color: infixColor }}>{infix}</span>
      <UIText kind="small/accent" inline={true}>
        {suffix}
      </UIText>
    </UIText>
  );
}
