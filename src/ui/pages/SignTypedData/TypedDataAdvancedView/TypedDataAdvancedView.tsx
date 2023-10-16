import React from 'react';
import { NavigationBar } from 'src/ui/components/NavigationBar';
import { TextLine } from 'src/ui/components/address-action/TextLine';
import { Surface } from 'src/ui/ui-kit/Surface';
import { VStack } from 'src/ui/ui-kit/VStack';
import type { InterpretInput } from 'src/modules/ethereum/transactions/types';
import { PageTop } from 'src/ui/components/PageTop';

export function TypedDataAdvancedView({ data }: { data: InterpretInput }) {
  return (
    <>
      <NavigationBar title="Advanced View" />
      <PageTop />
      <Surface padding={16}>
        <VStack gap={16}>
          {data.sections.flatMap(({ blocks }) =>
            blocks.map(({ name, value }) => (
              <TextLine wrap={true} key={name} label={name} value={value} />
            ))
          )}
        </VStack>
      </Surface>
    </>
  );
}
