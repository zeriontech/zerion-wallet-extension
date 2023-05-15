import React from 'react';
import { HStack } from '../HStack';
import { VStack } from '../VStack';

export function Media({
  image,
  text,
  detailText,
  gap = 8,
  vGap = 4,
  alignItems = 'center',
}: {
  image: React.ReactNode;
  text: React.ReactNode;
  detailText: React.ReactNode;
  /** Default: 8 */
  gap?: number;
  /** Default: 4 */
  vGap?: number;
  /** Default: 'center' */
  alignItems?: React.CSSProperties['alignItems'];
}) {
  return (
    <HStack gap={gap} alignItems={alignItems}>
      {image}
      <VStack gap={vGap} style={{ textAlign: 'start' }}>
        {text}
        {detailText}
      </VStack>
    </HStack>
  );
}
