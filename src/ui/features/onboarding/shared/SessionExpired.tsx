import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getCurrentUser } from 'src/shared/getCurrentUser';
import { VStack } from 'src/ui/ui-kit/VStack';
import { UIText } from 'src/ui/ui-kit/UIText';
import { Button } from 'src/ui/ui-kit/Button';
import SessionExpiredImg from '../assets/session-expired.png';
import * as helperStyles from '../shared/helperStyles.module.css';

export function SessionExpired({ onRestart }: { onRestart: () => void }) {
  const { data: existingUser, isLoading } = useQuery({
    queryKey: ['getCurrentUser'],
    queryFn: async () => {
      const result = await getCurrentUser();
      return result || null;
    },
    suspense: false,
    refetchOnWindowFocus: false,
  });

  if (isLoading) {
    return null;
  }

  const hasExistingUser = Boolean(existingUser);

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
          {!hasExistingUser ? (
            <UIText kind="body/regular" color="var(--neutral-600)">
              Try creating or importing another wallet
            </UIText>
          ) : null}
        </VStack>
        {!hasExistingUser ? (
          <Button kind="primary" onClick={onRestart}>
            Restart
          </Button>
        ) : null}
      </VStack>
    </div>
  );
}
