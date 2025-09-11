import React from 'react';
import { TextLine } from 'src/ui/components/address-action/TextLine';
import { Surface } from 'src/ui/ui-kit/Surface';
import { VStack } from 'src/ui/ui-kit/VStack';
import { PageTop } from 'src/ui/components/PageTop';
import type { InterpretInput } from 'src/modules/zerion-api/requests/wallet-simulate-signature';

export function TypedDataAdvancedView({
  inputs,
}: {
  inputs: InterpretInput[];
}) {
  return (
    <>
      <PageTop />
      <VStack gap={12}>
        {inputs.map((input, index) =>
          input.sections?.length ? (
            <Surface
              key={index}
              padding={16}
              style={{ backgroundColor: 'var(--neutral-100)' }}
            >
              <VStack gap={16}>
                {input.sections?.flatMap(({ blocks }, index) =>
                  blocks.map(({ name, value }) => (
                    <TextLine
                      wrap={true}
                      key={`${name}-${index}`}
                      label={name}
                      value={value}
                    />
                  ))
                )}
              </VStack>
            </Surface>
          ) : null
        )}
      </VStack>
    </>
  );
}
