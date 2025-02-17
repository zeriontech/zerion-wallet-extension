import React from 'react';
import CloseIcon from 'jsx:src/ui/assets/close.svg';
import { UnstyledButton } from 'src/ui/ui-kit/UnstyledButton';
import { Button } from 'src/ui/ui-kit/Button';
import { UIText } from 'src/ui/ui-kit/UIText';
import { TextAnchor } from 'src/ui/ui-kit/TextAnchor';
import { VStack } from 'src/ui/ui-kit/VStack';
import * as styles from './styles.module.css';

const EXPLORE_ZERO_URL =
  'https://zero.network/?utm_source=zerion-extension&utm_medium=banner&utm_campaign=zero-mainnet-launch';

export function ExploreZeroBanner({ onDismiss }: { onDismiss?(): void }) {
  return (
    <div className={styles.bannerContainer}>
      <img
        className={styles.image}
        style={{ width: 178, height: 140 }}
        src="https://cdn.zerion.io/images/dna-assets/rotating-zero.png"
        srcSet="https://cdn.zerion.io/images/dna-assets/rotating-zero.png, https://cdn.zerion.io/images/dna-assets/rotating-zero_2x.png 2x"
        alt=""
      />
      <VStack gap={16}>
        <UIText kind="headline/h3" color="var(--always-white)">
          Goodbye Gas Fees,
          <br /> Hello ZERϴ
        </UIText>
        <Button
          kind="regular"
          style={{
            ['--button-text' as string]: 'var(--always-black)',
            ['--button-background' as string]: 'var(--always-white)',
            ['--button-background-hover' as string]: '#f0f0f2',
            padding: '8px 9px',
            width: 109,
          }}
          size={32}
          as={TextAnchor}
          href={EXPLORE_ZERO_URL}
          target="_blank"
          rel="noopener noreferrer"
        >
          Explore ZERϴ
        </Button>
      </VStack>
      {onDismiss ? (
        <UnstyledButton
          onClick={onDismiss}
          aria-label="close"
          className={styles.closeButton}
        >
          <CloseIcon style={{ width: 16, height: 16 }} />
        </UnstyledButton>
      ) : null}
    </div>
  );
}
