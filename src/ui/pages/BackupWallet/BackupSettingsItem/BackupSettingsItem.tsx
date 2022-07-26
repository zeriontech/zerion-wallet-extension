import React from 'react';
import { useLastBackedUp } from 'src/ui/shared/requests/useLastBackedUp';
import { HStack } from 'src/ui/ui-kit/HStack';
import { UIText } from 'src/ui/ui-kit/UIText';
import { VStack } from 'src/ui/ui-kit/VStack';

function WarningIcon() {
  return (
    <div
      style={{
        width: 16,
        height: 16,
        borderRadius: '50%',
        color: 'var(--notice-500)',
        border: '2px solid var(--notice-500)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 12,
      }}
    >
      !
    </div>
  );
}

export function BackupSettingsItem() {
  const { data: lastBackedUp } = useLastBackedUp();
  return (
    <HStack gap={8} alignItems="center">
      {lastBackedUp == null ? <WarningIcon /> : null}
      <VStack gap={0}>
        <span>Back Up Wallet</span>

        {lastBackedUp ? (
          <UIText
            kind="caption/reg"
            color="var(--neutral-500)"
            style={{
              overflow: 'hidden',
              maxWidth: 336,
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            Last Backup:{' '}
            {new Intl.DateTimeFormat('en', {
              dateStyle: 'medium',
            }).format(lastBackedUp)}
          </UIText>
        ) : null}
      </VStack>
    </HStack>
  );
}
