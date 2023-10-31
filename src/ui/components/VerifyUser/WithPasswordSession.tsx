import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { SessionExpired } from 'src/shared/errors/errors';
import { accountPublicRPCPort } from 'src/ui/shared/channels';
import { Background } from '../Background';
import { NavigationTitle } from '../NavigationTitle';
import { PageColumn } from '../PageColumn';
import { PageTop } from '../PageTop';
import { PageBottom } from '../PageBottom';
import { VerifyUser } from './VerifyUser';

export function WithPasswordSession({
  text,
  children,
}: React.PropsWithChildren<{ text?: React.ReactNode }>) {
  const { data, isLoading } = useQuery({
    queryKey: ['passwordSessionData'],
    queryFn: async () => {
      const [hasActivePasswordSession, isPendingNewUser] = await Promise.all([
        accountPublicRPCPort.request('hasActivePasswordSession'),
        accountPublicRPCPort.request('isPendingNewUser'),
      ]);
      return { hasActivePasswordSession, isPendingNewUser };
    },
    suspense: true,
    useErrorBoundary: true,
  });
  const [verified, setVerified] = useState(false);
  if (isLoading || !data) {
    return null;
  }
  const { hasActivePasswordSession, isPendingNewUser } = data;
  if (!hasActivePasswordSession && isPendingNewUser) {
    // When there is a pending user (CreateAccount flow), it's complicated
    // to know which user object to verify (one in local storage or one in memory),
    // it is much more robust to throw the user out of the flow entirely.
    throw new SessionExpired();
  }
  if (!hasActivePasswordSession && !verified) {
    return (
      <Background backgroundKind="white">
        <PageColumn>
          <NavigationTitle title="Enter password" />
          <PageTop />
          <VerifyUser
            style={{ justifySelf: 'stretch' }}
            text={text}
            onSuccess={() => setVerified(true)}
          />
          <PageBottom />
        </PageColumn>
      </Background>
    );
  } else {
    return children as JSX.Element;
  }
}
