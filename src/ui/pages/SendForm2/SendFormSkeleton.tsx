import React from 'react';
import { PageColumn } from 'src/ui/components/PageColumn/PageColumn';
import { PageTop } from 'src/ui/components/PageTop/PageTop';
import { NavigationTitle } from 'src/ui/components/NavigationTitle/NavigationTitle';
import { HStack } from 'src/ui/ui-kit/HStack/HStack';
import { VStack } from 'src/ui/ui-kit/VStack';
import * as swapStyles from '../SwapForm2/styles.module.css';

function ReceiverRowSkeleton() {
  return (
    <div
      style={{
        background: 'var(--white)',
        border: '2px solid var(--neutral-200)',
        borderRadius: 20,
        padding: 16,
        width: '100%',
      }}
    >
      <HStack gap={8} alignItems="center">
        <div
          className={swapStyles.skeletonCircle}
          style={{ width: 24, height: 24 }}
        />
        <div
          className={swapStyles.skeleton}
          style={{ width: 120, height: 14 }}
        />
      </HStack>
    </div>
  );
}

function InputFieldsetSkeleton() {
  return (
    <div
      style={{
        background: 'var(--white)',
        borderRadius: 24,
        boxShadow: '0 4px 24px 0 rgba(0, 0, 0, 0.08)',
        padding: 16,
        width: '100%',
        boxSizing: 'border-box',
      }}
    >
      <VStack gap={6} style={{ width: '100%' }}>
        <HStack gap={16} justifyContent="space-between" alignItems="center">
          <div
            className={swapStyles.skeleton}
            style={{ width: 64, height: 20 }}
          />
          <div style={{ height: 20 }} />
        </HStack>
        <HStack
          gap={16}
          justifyContent="space-between"
          alignItems="center"
          style={{ height: 32 }}
        >
          <HStack gap={8} alignItems="center">
            <div
              className={swapStyles.skeletonCircle}
              style={{ width: 32, height: 32 }}
            />
            <div
              className={swapStyles.skeleton}
              style={{ width: 72, height: 24 }}
            />
          </HStack>
          <div
            className={swapStyles.skeleton}
            style={{ width: 96, height: 24 }}
          />
        </HStack>
        <HStack gap={16} justifyContent="space-between" alignItems="center">
          <div
            className={swapStyles.skeleton}
            style={{ width: 112, height: 20 }}
          />
          <div
            className={swapStyles.skeleton}
            style={{ width: 64, height: 20 }}
          />
        </HStack>
      </VStack>
    </div>
  );
}

export function SendFormSkeleton() {
  return (
    <PageColumn>
      <NavigationTitle title="Send" />
      <PageTop />
      <VStack gap={16} style={{ paddingBottom: 112 }}>
        <ReceiverRowSkeleton />
        <InputFieldsetSkeleton />
      </VStack>
    </PageColumn>
  );
}
