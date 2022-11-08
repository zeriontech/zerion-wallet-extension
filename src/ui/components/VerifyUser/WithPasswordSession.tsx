import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { accountPublicRPCPort } from 'src/ui/shared/channels';
import { Background } from '../Background';
import { FillView } from '../FillView';
import { NavigationTitle } from '../NavigationTitle';
import { PageColumn } from '../PageColumn';
import { VerifyUser } from './VerifyUser';

export function WithPasswordSession({
  text,
  children,
}: React.PropsWithChildren<{ text?: React.ReactNode }>) {
  const { data: hasActivePasswordSession, isLoading } = useQuery(
    'hasActivePasswordSession',
    () => {
      return accountPublicRPCPort.request('hasActivePasswordSession');
    },
    { suspense: true, useErrorBoundary: true }
  );
  const [verified, setVerified] = useState(false);
  if (isLoading) {
    return null;
  }
  if (!hasActivePasswordSession && !verified) {
    return (
      <Background backgroundKind="white">
        <PageColumn>
          <NavigationTitle title="Enter password" />
          <FillView adjustForNavigationBar={true}>
            <VerifyUser
              style={{ justifySelf: 'stretch' }}
              text={text}
              onSuccess={() => setVerified(true)}
            />
          </FillView>
        </PageColumn>
      </Background>
    );
  } else {
    return children as JSX.Element;
  }
}
