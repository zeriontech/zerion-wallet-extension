import React from 'react';
import { VStack } from 'src/ui/ui-kit/VStack';
import { UIText } from 'src/ui/ui-kit/UIText';
import * as styles from './UnverifiedWarning.module.css';

export function UnverifiedWarning() {
  return (
    <div className={styles.card}>
      <VStack gap={8}>
        <UIText kind="small/accent" color="currentColor">
          Transaction Unverified
        </UIText>
        <UIText kind="small/regular" color="currentColor">
          Our security provider Blockaid does not support this network for
          security checks. Please proceed with caution.
        </UIText>
      </VStack>
    </div>
  );
}
