import React from 'react';
import { HStack } from 'src/ui/ui-kit/HStack';
import { VStack } from 'src/ui/ui-kit/VStack';
import ValidationErrorIcon from 'jsx:src/ui/assets/validation-error.svg';
import { Spacer } from 'src/ui/ui-kit/Spacer';
import { UIText } from 'src/ui/ui-kit/UIText';

export function TransactionWarning({
  title,
  message,
}: {
  title: string;
  message: string;
}) {
  return (
    <>
      <VStack
        gap={8}
        style={{
          padding: 16,
          borderRadius: 8,
          border: '1px solid var(--notice-500)',
        }}
      >
        <HStack gap={8} alignItems="center">
          <ValidationErrorIcon style={{ color: 'var(--notice-600)' }} />
          <UIText kind="body/accent" color="var(--notice-600)">
            {title}
          </UIText>
        </HStack>
        <UIText kind="small/regular" color="var(--notice-600)">
          {message}
        </UIText>
      </VStack>
      <Spacer height={16} />
    </>
  );
}
