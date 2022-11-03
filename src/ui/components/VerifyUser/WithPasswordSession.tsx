import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { accountPublicRPCPort } from 'src/ui/shared/channels';
import { Background } from '../Background';
import { NavigationTitle } from '../NavigationTitle';
import { PageColumn } from '../PageColumn';
import { PageTop } from '../PageTop';
import { VerifyUser } from './VerifyUser';

export function WithPasswordSession({
  text,
  children,
}: React.PropsWithChildren<{ text?: string }>) {
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
          <PageTop />
          <NavigationTitle title="Enter password" />
          <VerifyUser text={text} onSuccess={() => setVerified(true)} />
        </PageColumn>
      </Background>
    );
  } else {
    return children as JSX.Element;
  }
}
