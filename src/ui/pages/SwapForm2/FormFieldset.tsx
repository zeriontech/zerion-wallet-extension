import React from 'react';
import { HStack } from 'src/ui/ui-kit/HStack';
import { UIText } from 'src/ui/ui-kit/UIText';
import { VStack } from 'src/ui/ui-kit/VStack';

export function FormFieldset({
  startTitle,
  endTitle,
  startContent,
  endContent,
  startDescription,
  endDescription,
  inputId,
}: {
  startTitle: React.ReactNode;
  endTitle: React.ReactNode;
  startContent: React.ReactNode;
  endContent: React.ReactNode;
  startDescription: React.ReactNode;
  endDescription: React.ReactNode;
  inputId: string;
}) {
  return (
    <fieldset
      style={{ background: 'none', border: 'none', padding: 16, margin: 0 }}
      onClick={(event) => {
        const target = event.target as Node;
        const container = event.currentTarget;
        if (
          target === container ||
          target.parentElement === container ||
          target.parentElement?.parentElement === container
        ) {
          const input = event.currentTarget.querySelector(
            `#${CSS.escape(inputId)}`
          );
          if (input && input instanceof HTMLInputElement) {
            input.focus();
          }
        }
      }}
    >
      <VStack gap={6} style={{ padding: 0, width: '100%' }}>
        <HStack
          gap={16}
          justifyContent="space-between"
          style={{ width: '100%' }}
        >
          <UIText kind="small/regular" as="label" htmlFor={inputId}>
            {startTitle}
          </UIText>
          <div>{endTitle}</div>
        </HStack>
        <HStack
          gap={16}
          justifyContent="space-between"
          alignItems="center"
          style={{ width: '100%' }}
        >
          <UIText kind="headline/h3" style={{ display: 'flex' }}>
            {startContent}
          </UIText>
          <UIText kind="headline/h3"> {endContent}</UIText>
        </HStack>
        <HStack
          gap={16}
          justifyContent="space-between"
          style={{ width: '100%' }}
        >
          <UIText kind="small/regular" color="var(--neutral-600)">
            {startDescription}
          </UIText>
          <UIText kind="small/regular" color="var(--neutral-600)">
            {endDescription}
          </UIText>
        </HStack>
      </VStack>
    </fieldset>
  );
}
