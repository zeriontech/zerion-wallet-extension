import React, { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  checkVersion,
  eraseAndUpdateToLatestVersion,
} from 'src/shared/core/version';
import { Button } from 'src/ui/ui-kit/Button';
import { UIText } from 'src/ui/ui-kit/UIText';
import { VStack } from 'src/ui/ui-kit/VStack';
import { accountPublicRPCPort } from 'src/ui/shared/channels';
import { PageColumn } from '../PageColumn';
import { FillView } from '../FillView';

export function VersionUpgrade({ children }: React.PropsWithChildren) {
  const { data, isLoading, refetch } = useQuery(
    'checkVersion',
    () => checkVersion(),
    {
      retry: false,
      refetchOnMount: false,
      staleTime: Infinity,
      refetchOnReconnect: false,
      refetchOnWindowFocus: false,
      useErrorBoundary: true,
    }
  );
  const [ignoreWarning, setIgnoreWarning] = useState(false);
  const eraseMutation = useMutation(
    async () => {
      await accountPublicRPCPort.request('logout');
      return eraseAndUpdateToLatestVersion();
    },
    {
      useErrorBoundary: true,
      onSuccess() {
        refetch();
      },
    }
  );
  if (isLoading) {
    return null;
  }
  if (
    !ignoreWarning &&
    data?.storageVersion.mismatch &&
    data.storageVersion.action === 'clear-storage'
  ) {
    const CAN_LOGIN_TO_OLD_VERSION = false;
    return (
      <FillView>
        <PageColumn>
          <VStack gap={20} style={{ textAlign: 'center' }}>
            <UIText
              kind="headline/h2"
              color="var(--neutral-300)"
              style={{
                fontSize: 90,
                lineHeight: 0.8,
                userSelect: 'none',
                marginTop: -60,
              }}
            >
              ⚙
            </UIText>
            <UIText kind="headline/h2">Version Upgrade </UIText>
            <UIText kind="body/regular" style={{ textAlign: 'start' }}>
              Hello, alpha user! I have updated storage schema.
              <br />
              To upgrade, existing storage needs to be cleared. You will have to
              import everything again.
            </UIText>
            <VStack gap={0}>
              <Button
                kind="ghost"
                style={{ color: 'var(--primary)', fontWeight: 'normal' }}
                disabled={eraseMutation.isLoading}
                onClick={() => {
                  eraseMutation.mutate();
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    gap: 8,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <span>Wipe out everything</span>
                  <span style={{ fontSize: '1.5em' }}>🥳</span>
                </div>
              </Button>

              {CAN_LOGIN_TO_OLD_VERSION ? (
                <Button
                  kind="ghost"
                  style={{ fontWeight: 'normal' }}
                  onClick={() => setIgnoreWarning(true)}
                >
                  Use old storage to make backups
                </Button>
              ) : null}
            </VStack>
          </VStack>
        </PageColumn>
      </FillView>
    );
  } else {
    return children as JSX.Element;
  }
}
