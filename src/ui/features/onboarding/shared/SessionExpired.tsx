import React from 'react';
import { VStack } from 'src/ui/ui-kit/VStack';
import { UIText } from 'src/ui/ui-kit/UIText';
import { Button } from 'src/ui/ui-kit/Button';
import SessionExpiredImg from '../assets/session-expired.png';
import * as helperStyles from '../shared/helperStyles.module.css';

export function SessionExpired({ onSubmit }: { onSubmit(): void }) {
  return (
    <div className={helperStyles.container}>
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <img
          alt="session expired"
          src={SessionExpiredImg}
          width={185}
          height={144}
        />
      </div>
      <VStack
        gap={40}
        style={{ justifyContent: 'center', textAlign: 'center' }}
      >
        <VStack
          gap={12}
          style={{ justifyContent: 'center', textAlign: 'center' }}
        >
          <UIText kind="headline/h1" color="var(--neutral-600)">
            Session expired
          </UIText>
          <UIText kind="body/regular" color="var(--neutral-600)">
            Try creating another wallet
          </UIText>
        </VStack>
        <Button kind="primary" onClick={onSubmit}>
          Restart
        </Button>
      </VStack>
    </div>
  );
}
