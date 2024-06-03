import React from 'react';
import { VStack } from 'src/ui/ui-kit/VStack';
import { UIText } from 'src/ui/ui-kit/UIText';
import { UnstyledAnchor } from 'src/ui/ui-kit/UnstyledAnchor';
import { openInPageTabView } from 'src/ui/shared/openInNewWindow';
import { DnaBanner } from '../shared/DnaBanner';
import * as styles from './styles.module.css';

export function MintBanner({
  address,
  onDismiss,
}: {
  address: string;
  onDismiss?(): void;
}) {
  return (
    <DnaBanner
      style={{
        background: 'linear-gradient(277deg, #FFBDFF 0%, #FF7583 100%)',
      }}
      onDismiss={onDismiss}
    >
      <VStack gap={16} style={{ justifyItems: 'start' }}>
        <VStack gap={4}>
          <UIText kind="headline/h3" color="var(--always-white)">
            Mint your Zerion DNA
          </UIText>
          <UIText kind="small/accent" color="var(--always-white)">
            With exclusive attribute
          </UIText>
        </VStack>
        <UnstyledAnchor
          href={`#/mint-dna?address=${address}`}
          target="_blank"
          onClick={openInPageTabView}
          className={styles.button}
        >
          <UIText kind="small/accent">Continue</UIText>
        </UnstyledAnchor>
      </VStack>
    </DnaBanner>
  );
}
