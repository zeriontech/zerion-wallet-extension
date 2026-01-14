import React from 'react';
import { PageBottom } from 'src/ui/components/PageBottom';
import { PageColumn } from 'src/ui/components/PageColumn';
import { PageTop } from 'src/ui/components/PageTop';
import { Button } from 'src/ui/ui-kit/Button';
import { UIText } from 'src/ui/ui-kit/UIText';
import { VStack } from 'src/ui/ui-kit/VStack';
import { useBackgroundKind } from 'src/ui/components/Background';
import { TextAnchor } from 'src/ui/ui-kit/TextAnchor';
import { openInNewWindow } from 'src/ui/shared/openInNewWindow';
import WarningIcon from 'jsx:src/ui/assets/warning.svg';
import { Spacer } from 'src/ui/ui-kit/Spacer';
import { useMutation } from '@tanstack/react-query';
import { walletPort } from 'src/ui/shared/channels';
import { useNavigate } from 'react-router-dom';
import { getError } from 'get-error';

export function RestoreData() {
  const navigate = useNavigate();
  useBackgroundKind({ kind: 'white' });

  const handleRestoreDataMutation = useMutation({
    mutationFn: () => {
      return walletPort.request('restoreBackupData');
    },
    onSuccess: () => {
      navigate('/', { replace: true });
      window.location.reload();
    },
  });

  return (
    <PageColumn>
      <PageTop />
      <VStack
        gap={24}
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          paddingInline: 16,
        }}
      >
        <Spacer height={36} />
        <VStack gap={8} style={{ maxWidth: 400, justifyItems: 'center' }}>
          <WarningIcon
            style={{
              width: 64,
              height: 64,
              color: 'var(--notice-500)',
            }}
          />
          <UIText kind="headline/h2">Password update was interrupted</UIText>
          <UIText kind="body/regular" color="var(--neutral-500)">
            But we've made a backup! Click the button below to restore your
            data.
          </UIText>
          <UIText kind="body/regular" color="var(--neutral-500)">
            Please, use your previous password to restore access to your wallet.
          </UIText>
        </VStack>
        <VStack gap={8} style={{ alignSelf: 'end' }}>
          <UIText kind="body/regular" color="var(--neutral-500)">
            If the problem persists, please{' '}
            <TextAnchor
              href="https://help.zerion.io"
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => {
                e.stopPropagation();
                openInNewWindow(e);
              }}
              style={{ color: 'var(--primary)' }}
            >
              contact our support
            </TextAnchor>
          </UIText>
          <Button
            kind="primary"
            onClick={() => handleRestoreDataMutation.mutate()}
          >
            Restore Data
          </Button>
          {handleRestoreDataMutation.isError ? (
            <UIText kind="caption/regular" color="var(--negative-500)">
              {getError(handleRestoreDataMutation.error).message}
            </UIText>
          ) : null}
        </VStack>
      </VStack>
      <PageBottom />
    </PageColumn>
  );
}
