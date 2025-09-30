import React from 'react';
import { Surface } from 'src/ui/ui-kit/Surface';
import { PageTop } from 'src/ui/components/PageTop';
import type { TypedData } from 'src/modules/ethereum/message-signing/TypedData';

export function TypedDataAdvancedView({ typedData }: { typedData: TypedData }) {
  return (
    <>
      <PageTop />
      <Surface padding={16} style={{ backgroundColor: 'var(--neutral-100)' }}>
        {JSON.stringify(typedData)}
      </Surface>
    </>
  );
}
