import React from 'react';
import { TextLine } from 'src/ui/components/address-action/TextLine';
import { Surface } from 'src/ui/ui-kit/Surface';
import { VStack } from 'src/ui/ui-kit/VStack';
import type { InterpretInput } from 'src/modules/ethereum/transactions/types';
import { PageTop } from 'src/ui/components/PageTop';

export function TypedDataAdvancedView({ data }: { data: InterpretInput }) {
  return (
    <>
      <PageTop />
      <Surface padding={16}>
        <VStack gap={16}>
          {data.sections.flatMap(({ blocks }, index) =>
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
    </>
  );
}
