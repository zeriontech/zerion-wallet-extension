import React from 'react';
import { TextLine } from 'src/ui/components/address-action/TextLine';
import { Surface } from 'src/ui/ui-kit/Surface';
import { VStack } from 'src/ui/ui-kit/VStack';

type Value = unknown;
type TypedData = Record<string, Value>;

function flattenObject(obj: TypedData, prefix = '') {
  return Object.keys(obj).reduce<Record<string, string>>((acc, key) => {
    const leadingPrefix = prefix.length ? prefix + '.' : '';
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      Object.assign(
        acc,
        flattenObject(obj[key] as TypedData, `${leadingPrefix}${key}`)
      );
    } else {
      acc[`${leadingPrefix}${key}`] = String(obj[key]);
    }
    return acc;
  }, {});
}

export function TypedDataAdvancedView({ data }: { data: TypedData }) {
  const flattenedData = flattenObject(data);
  return (
    <Surface padding={16}>
      <VStack gap={16}>
        {Object.entries(flattenedData).map(([label, value]) => (
          <TextLine wrap={true} key={label} label={label} value={value} />
        ))}
      </VStack>
    </Surface>
  );
}
