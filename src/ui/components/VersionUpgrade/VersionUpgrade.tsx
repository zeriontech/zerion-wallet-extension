import React, { useState } from 'react';
import { useMutation, useQuery } from 'react-query';
import {
  checkVersion,
  eraseAndUpdateToLatestVersion,
} from 'src/shared/core/version';
import { Button } from 'src/ui/ui-kit/Button';
import { UIText } from 'src/ui/ui-kit/UIText';
import { VStack } from 'src/ui/ui-kit/VStack';
import { FillView } from '../FillView';
import { PageColumn } from '../PageColumn';
import CheckIcon from 'jsx:src/ui/assets/checkmark-checked.svg';
import { HStack } from 'src/ui/ui-kit/HStack';
import { accountPublicRPCPort } from 'src/ui/shared/channels';

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
              Hello, alpha user! I have updated storage schema, and now
              <HStack gap={8} style={{ marginTop: 12, marginBottom: 12 }}>
                <CheckIcon
                  style={{
                    color: 'var(--positive-500)',
                    width: 20,
                    height: 20,
                    position: 'relative',
                    top: 2,
                  }}
                />
                Recovery phrases will be kept encrypted even when you are logged
                in
              </HStack>
              To upgrade, existing storage needs to cleared. You will have to
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

              <Button
                kind="ghost"
                style={{ fontWeight: 'normal' }}
                onClick={() => setIgnoreWarning(true)}
              >
                Use old storage to make backups
              </Button>
            </VStack>
          </VStack>
        </PageColumn>
      </FillView>
    );
  } else {
    return children as JSX.Element;
  }
}
