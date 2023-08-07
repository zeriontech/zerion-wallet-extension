import React from 'react';
import { TextLine } from 'src/ui/components/address-action/TextLine';
import { Surface } from 'src/ui/ui-kit/Surface';
import { VStack } from 'src/ui/ui-kit/VStack';

export function TypedDataAdvancedView({
  data,
}: {
  data: Record<string, string>;
}) {
  return (
    <Surface padding={16}>
      <VStack gap={16}>
        {Object.entries(data).map(([label, value]) => (
          <TextLine wrap={true} key={label} label={label} value={value} />
        ))}
      </VStack>
    </Surface>
  );
}
