import React from 'react';
import { HStack } from 'src/ui/ui-kit/HStack';
import { VStack } from 'src/ui/ui-kit/VStack';
import ValidationErrorIcon from 'jsx:src/ui/assets/validation-error.svg';
import { Spacer } from 'src/ui/ui-kit/Spacer';
import { UIText } from 'src/ui/ui-kit/UIText';

export function TransactionMayFailWarning() {
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
            Transaction may fail
          </UIText>
        </HStack>
        <UIText kind="small/regular" color="var(--notice-600)">
          This transaction can not be broadcasted or it may fail during
          execution. Proceed with caution.
        </UIText>
      </VStack>
      <Spacer height={16} />
    </>
  );
}
