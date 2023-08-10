import React from 'react';
import { TextLine } from 'src/ui/components/address-action/TextLine';
import { Surface } from 'src/ui/ui-kit/Surface';
import { VStack } from 'src/ui/ui-kit/VStack';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Value = any;
type TypedData = Record<string, Value>;

function flattenObject(obj: TypedData, prefix = '') {
  return Object.keys(obj).reduce((acc, key) => {
    const leadingPrefix = prefix.length ? prefix + '.' : '';
    if (typeof obj[key] === 'object') {
      Object.assign(acc, flattenObject(obj[key], `${leadingPrefix}${key}`));
    } else {
      acc[`${leadingPrefix}${key}`] = obj[key];
    }
    return acc;
  }, {} as TypedData);
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
