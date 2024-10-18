import React from 'react';
import { HStack } from 'src/ui/ui-kit/HStack';
import { UIText } from 'src/ui/ui-kit/UIText';

export function UnorderedListItem({
  marker,
  text,
}: {
  marker: React.ReactNode;
  text: React.ReactNode;
}) {
  return (
    <HStack gap={12}>
      {marker}
      <UIText kind="body/regular">{text}</UIText>
    </HStack>
  );
}
