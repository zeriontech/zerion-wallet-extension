import React from 'react';
import { HStack } from 'src/ui/ui-kit/HStack';
import { VStack } from 'src/ui/ui-kit/VStack';
import * as skeletonStyles from 'src/ui/ui-kit/Skeleton/Skeleton.module.css';

function StatColumnSkeleton({ align = 'start' }: { align?: 'start' | 'end' }) {
  return (
    <VStack gap={4} style={{ alignItems: align === 'end' ? 'flex-end' : 'flex-start' }}>
      <div className={skeletonStyles.skeleton} style={{ width: 56, height: 12 }} />
      <div className={skeletonStyles.skeleton} style={{ width: 72, height: 16 }} />
    </VStack>
  );
}

export function PerpsPositionCardSkeleton() {
  return (
    <div
      style={{
        padding: 16,
        marginInline: 8,
        borderRadius: 13,
      }}
    >
      <VStack gap={12}>
        <HStack gap={12} alignItems="center">
          <HStack gap={8} alignItems="center" style={{ flex: 1, minWidth: 0 }}>
            <div className={skeletonStyles.skeletonCircle} style={{ width: 36, height: 36 }} />
            <VStack gap={4}>
              <div className={skeletonStyles.skeleton} style={{ width: 80, height: 16 }} />
              <div className={skeletonStyles.skeleton} style={{ width: 64, height: 16 }} />
            </VStack>
          </HStack>
          <VStack gap={4} style={{ alignItems: 'flex-end', flexShrink: 0 }}>
            <div className={skeletonStyles.skeleton} style={{ width: 72, height: 16 }} />
            <div className={skeletonStyles.skeleton} style={{ width: 96, height: 16 }} />
          </VStack>
        </HStack>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: 16,
          }}
        >
          <StatColumnSkeleton />
          <StatColumnSkeleton />
          <StatColumnSkeleton align="end" />
        </div>
      </VStack>
    </div>
  );
}

export function PerpsPositionsListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <VStack gap={0}>
      {Array.from({ length: count }).map((_, index) => (
        <React.Fragment key={index}>
          {index > 0 ? (
            <div
              style={{
                backgroundColor: 'var(--neutral-200)',
                height: 1,
                marginInline: 8,
              }}
            />
          ) : null}
          <PerpsPositionCardSkeleton />
        </React.Fragment>
      ))}
    </VStack>
  );
}
