import React from 'react';
import { HStack } from '../HStack';
import { VStack } from '../VStack';

export function Media({
  image,
  text,
  detailText,
  gap = 8,
  vGap = 4,
}: {
  image: React.ReactNode;
  text: React.ReactNode;
  detailText: React.ReactNode;
  gap?: number;
  vGap?: number;
}) {
  return (
    <HStack gap={gap} alignItems="center">
      {image}
      <VStack gap={vGap} style={{ textAlign: 'start' }}>
        {text}
        {detailText}
      </VStack>
    </HStack>
  );
}
