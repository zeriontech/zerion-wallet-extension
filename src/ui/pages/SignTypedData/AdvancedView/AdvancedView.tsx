import React from 'react';
import { TextLine } from 'src/ui/components/address-action/TextLine';
import { Surface } from 'src/ui/ui-kit/Surface';

export function AdvancedView({ data }: { data: Record<string, string> }) {
  return (
    <Surface padding={16}>
      {Object.entries(data).map(([label, value]) => (
        <TextLine wrap={true} key={label} label={label} value={value} />
      ))}
    </Surface>
  );
}
