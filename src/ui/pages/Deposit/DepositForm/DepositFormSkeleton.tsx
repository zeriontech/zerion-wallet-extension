import React from 'react';
import { Background } from 'src/ui/components/Background';
import { NavigationTitle } from 'src/ui/components/NavigationTitle';
import { PageColumn } from 'src/ui/components/PageColumn';
import { HStack } from 'src/ui/ui-kit/HStack';
import { Spacer } from 'src/ui/ui-kit/Spacer';
import { UIText } from 'src/ui/ui-kit/UIText';
import { VStack } from 'src/ui/ui-kit/VStack';
import { DEPOSIT_PAGE_TOP } from '../shared/constants';
import { DepositHeaderControls } from '../shared/DepositHeaderControls';
import { DepositSubtitle } from '../shared/DepositSubtitle';
import * as styles from './styles.module.css';

/**
 * Mirrors `FormFieldset`'s three rows at the same 16px padding, so the values
 * land in place rather than shifting the surface around them. The row labels
 * are real text: "Pay with" and "Receive" are fixed, and greying them out for
 * a few hundred milliseconds only makes the wait more conspicuous.
 */
function FieldsetSkeleton({
  title,
  withIcon,
}: {
  title: string;
  /** The currency selector is bare text; only the token side has an icon. */
  withIcon: boolean;
}) {
  return (
    <div style={{ padding: 16 }}>
      <VStack gap={6} style={{ width: '100%' }}>
        <UIText kind="small/regular">{title}</UIText>
        <HStack
          gap={16}
          justifyContent="space-between"
          alignItems="center"
          style={{ height: withIcon ? 32 : 24 }}
        >
          <HStack gap={8} alignItems="center">
            {withIcon ? (
              <div
                className={styles.skeletonCircle}
                style={{ width: 32, height: 32 }}
              />
            ) : null}
            <div
              className={styles.skeleton}
              style={{ width: 64, height: 24 }}
            />
          </HStack>
          <div className={styles.skeleton} style={{ width: 88, height: 24 }} />
        </HStack>
      </VStack>
    </div>
  );
}

export function DepositFormSkeleton({ address }: { address?: string }) {
  return (
    <Background backgroundKind="white">
      <DepositHeaderControls
        address={address ?? null}
        settingsDisabled={true}
      />
      <PageColumn>
        <Spacer height={DEPOSIT_PAGE_TOP} />
        <NavigationTitle title="Buy Crypto" />
        <VStack gap={16}>
          <DepositSubtitle />
          <VStack gap={0} className={styles.fieldsetSurface}>
            <FieldsetSkeleton title="Pay with" withIcon={false} />
            <div className={styles.divider} />
            <FieldsetSkeleton title="Receive" withIcon={true} />
          </VStack>
          <div className={styles.skeletonButton} />
        </VStack>
      </PageColumn>
    </Background>
  );
}
