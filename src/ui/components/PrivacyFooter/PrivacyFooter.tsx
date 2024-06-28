import React from 'react';
import { HStack } from 'src/ui/ui-kit/HStack';
import { UIText } from 'src/ui/ui-kit/UIText';
import lockIconSrc from 'jsx:src/ui/assets/lock.png';
import { TextAnchor } from 'src/ui/ui-kit/TextAnchor';
import * as styles from 'src/ui/style/helpers.module.css';

export function PrivacyFooter() {
  return (
    <HStack gap={8} justifyContent="center">
      <img src={lockIconSrc} alt="" style={{ width: 20, height: 20 }} />
      <UIText kind="small/accent" color="var(--neutral-600)">
        We never store your keys. Please find more details in our{' '}
        <TextAnchor
          href="https://zerion.io/privacy.pdf"
          target="_blank"
          rel="noopener noreferrer"
          className={styles.hoverUnderline}
        >
          <UIText kind="small/accent" color="var(--primary)" inline={true}>
            Privacy Policy.
          </UIText>
        </TextAnchor>
      </UIText>
    </HStack>
  );
}
