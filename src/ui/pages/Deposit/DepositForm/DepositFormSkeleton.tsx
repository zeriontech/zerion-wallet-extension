import React from 'react';
import { Background } from 'src/ui/components/Background';
import { NavigationTitle } from 'src/ui/components/NavigationTitle';
import { PageColumn } from 'src/ui/components/PageColumn';
import { PageTop } from 'src/ui/components/PageTop';
import { VStack } from 'src/ui/ui-kit/VStack';
import * as styles from './styles.module.css';

export function DepositFormSkeleton() {
  return (
    <Background backgroundKind="white">
      <PageColumn>
        <PageTop />
        <NavigationTitle title="Buy Crypto" backTo="/deposit" />
        <VStack gap={16}>
          <div className={styles.skeletonFieldset} />
          <div className={styles.skeletonFieldset} />
          <div className={styles.skeletonButton} />
        </VStack>
      </PageColumn>
    </Background>
  );
}
