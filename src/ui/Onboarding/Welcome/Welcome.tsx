import React from 'react';
import { Button } from 'src/ui/ui-kit/Button';
import { Spacer } from 'src/ui/ui-kit/Spacer';
import { UIText } from 'src/ui/ui-kit/UIText';
import { VStack } from 'src/ui/ui-kit/VStack';
import * as styles from './styles.module.css';

function MainForm() {
  return (
    <div className={styles.container}>
      <VStack gap={0} style={{ alignContent: 'center', maxWidth: 516 }}>
        <UIText kind="headline/h1">
          Zerion Extension Mode:
          <br />
          Activated
        </UIText>
        <Spacer height={24} />
        <UIText kind="body/accent" style={{ opacity: 0.8 }}>
          We are slowly opening up access. See if you’re on the list.
        </UIText>
        <Spacer height={24} />
        <input
          className={styles.input}
          placeholder="Enter your address or domain"
        />
        <Spacer height={40} />
        <Button kind="primary" size={44}>
          Check Eligibility
        </Button>
      </VStack>
    </div>
  );
}

function EligibleFAQ() {
  return <div />;
}

export function Welcome() {
  return (
    <VStack gap={40}>
      <MainForm />
      <EligibleFAQ />
    </VStack>
  );
}
