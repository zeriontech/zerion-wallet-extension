import React from 'react';
import SyncIcon from 'jsx:src/ui/assets/sync.svg';
import { PageColumn } from 'src/ui/components/PageColumn/PageColumn';
import { PageTop } from 'src/ui/components/PageTop/PageTop';
import { NavigationTitle } from 'src/ui/components/NavigationTitle/NavigationTitle';
import { HStack } from 'src/ui/ui-kit/HStack/HStack';
import { VStack } from 'src/ui/ui-kit/VStack';
import { UIText } from 'src/ui/ui-kit/UIText';
import { UnstyledButton } from 'src/ui/ui-kit/UnstyledButton';
import { MiddleLine } from './ReverseButton';
import * as styles from './styles.module.css';

function FieldsetSkeleton() {
  return (
    <div style={{ padding: 16 }}>
      <VStack gap={6} style={{ width: '100%' }}>
        <HStack gap={16} justifyContent="space-between" alignItems="center">
          <div className={styles.skeleton} style={{ width: 64, height: 20 }} />
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
              className={styles.skeletonCircle}
              style={{ width: 32, height: 32 }}
            />
            <div
              className={styles.skeleton}
              style={{ width: 72, height: 24 }}
            />
          </HStack>
          <div className={styles.skeleton} style={{ width: 96, height: 24 }} />
        </HStack>
        <HStack gap={16} justifyContent="space-between" alignItems="center">
          <div className={styles.skeleton} style={{ width: 112, height: 20 }} />
          <div className={styles.skeleton} style={{ width: 64, height: 20 }} />
        </HStack>
      </VStack>
    </div>
  );
}

function SkeletonForm({ tinted = false }: { tinted?: boolean }) {
  return (
    <div
      className={`${styles.formContainer} ${tinted ? styles.errorTint : ''}`}
    >
      <FieldsetSkeleton />
      <MiddleLine />
      <div className={styles.reverseButton}>
        <div
          className={styles.skeletonCircle}
          style={{ width: 20, height: 20 }}
        />
      </div>
      <FieldsetSkeleton />
    </div>
  );
}

export function SwapFormSkeleton() {
  return (
    <PageColumn>
      <PageTop />
      <NavigationTitle title="Swap" />
      <VStack
        gap={24}
        style={{ position: 'relative', flex: 1, alignContent: 'start' }}
      >
        <SkeletonForm />
      </VStack>
    </PageColumn>
  );
}

export function SwapFormError({ onReload }: { onReload?: () => void }) {
  return (
    <PageColumn>
      <PageTop />
      <NavigationTitle title="Swap" />
      <VStack
        gap={16}
        style={{ position: 'relative', flex: 1, alignContent: 'start' }}
      >
        <SkeletonForm tinted />
        <div className={styles.errorCard}>
          <HStack gap={12} justifyContent="space-between" alignItems="center">
            <VStack gap={4}>
              <UIText kind="small/accent" color="currentColor">
                Couldn’t load swap
              </UIText>
              <UIText kind="small/regular" color="currentColor">
                Something went wrong while preparing the form. Check your
                connection and try again.
              </UIText>
            </VStack>
            {onReload ? (
              <UnstyledButton
                type="button"
                className={styles.errorReloadButton}
                onClick={onReload}
                aria-label="Reload"
                title="Reload"
              >
                <SyncIcon style={{ display: 'block' }} />
              </UnstyledButton>
            ) : null}
          </HStack>
        </div>
      </VStack>
    </PageColumn>
  );
}
