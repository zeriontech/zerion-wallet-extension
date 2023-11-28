import React from 'react';
import { VStack } from 'src/ui/ui-kit/VStack';
import { UIText } from 'src/ui/ui-kit/UIText';
import { UnstyledAnchor } from 'src/ui/ui-kit/UnstyledAnchor';
import { openInFullScreen } from 'src/ui/shared/openInNewWindow';
import { DnaBanner } from '../shared/DnaBanner';
import * as styles from './styles.module.css';

export function UpgradeBanner({
  address,
  onDismiss,
}: {
  address: string;
  onDismiss?(): void;
}) {
  return (
    <DnaBanner
      style={{
        background: 'linear-gradient(97deg, #3232DC 0%, #FF7583 100%)',
      }}
      onDismiss={onDismiss}
    >
      <VStack gap={16} style={{ justifyItems: 'start' }}>
        <UIText kind="headline/h3" color="var(--always-white)">
          Give your DNA
          <br />a new look
        </UIText>
        <UnstyledAnchor
          href={`#/upgrade-dna?address=${address}`}
          target="_blank"
          onClick={openInFullScreen}
          className={styles.button}
        >
          <UIText kind="small/accent">Continue</UIText>
        </UnstyledAnchor>
      </VStack>
    </DnaBanner>
  );
}
