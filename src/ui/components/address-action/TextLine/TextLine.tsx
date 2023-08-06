import React from 'react';
import { noValueDash } from 'src/ui/shared/typography';
import { Spacer } from 'src/ui/ui-kit/Spacer';
import { UIText } from 'src/ui/ui-kit/UIText';
import { VStack } from 'src/ui/ui-kit/VStack';

export function TextLine({
  label,
  wrap = false,
  value,
}: {
  label: React.ReactNode;
  wrap?: boolean;
  value?: React.ReactNode;
}) {
  return (
    <VStack gap={0}>
      <UIText kind="small/regular" color="var(--neutral-500)">
        {label}
      </UIText>
      <Spacer height={4} />
      <UIText
        kind="body/regular"
        color="var(--black)"
        style={
          wrap
            ? { whiteSpace: 'pre-wrap', wordBreak: 'break-all' }
            : { whiteSpace: 'nowrap' }
        }
      >
        {value || noValueDash}
      </UIText>
    </VStack>
  );
}
