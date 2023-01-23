import React from 'react';
import { HStack } from 'src/ui/ui-kit/HStack';
import { VStack } from 'src/ui/ui-kit/VStack';
import * as styles from './styles.module.css';

function Skeleton({
  width,
  height,
}: {
  width: React.CSSProperties['width'];
  height: React.CSSProperties['height'];
}) {
  return (
    <div
      className={styles.skeleton}
      style={{
        width,
        height,
        borderRadius: 4,
        backgroundColor: 'var(--neutral-500)',
      }}
    />
  );
}

export function FeedSkeleton() {
  return (
    <VStack gap={16} style={{ padding: '0 16px' }}>
      <div />
      <VStack gap={8}>
        <VStack gap={12}>
          <HStack gap={8}>
            <Skeleton width={66} height={24} />
            <Skeleton width={48} height={24} />
          </HStack>
          <Skeleton width={100} height={28} />
        </VStack>
        <HStack gap={8} justifyContent="space-between">
          <Skeleton width={52} height={20} />
          <Skeleton width={40} height={20} />
        </HStack>
        <Skeleton width="100%" height={24} />
      </VStack>
      <HStack
        gap={8}
        style={{
          gridTemplateColumns: '1fr 40px 40px',
        }}
      >
        <Skeleton width="100%" height={40} />
        <Skeleton width={40} height={40} />
        <Skeleton width={40} height={40} />
      </HStack>
      <div />
    </VStack>
  );
}
