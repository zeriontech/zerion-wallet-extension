import React, { useMemo } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { useBodyStyle } from 'src/ui/components/Background/Background';
import { useScreenViewChange } from 'src/ui/shared/useScreenViewChange';
import { getCurrentUser } from 'src/shared/getCurrentUser';
import { useQuery } from '@tanstack/react-query';
import { Success } from './Success';
import { Welcome } from './Welcome';
import { Import } from './Import';
import { Create } from './Create';
import { Hardware } from './Hardware';
import { SessionExpired } from './shared/SessionExpired';
import { PageLayout } from './shared/PageLayout';
import { Backup } from './Backup';

export function Onboarding() {
  const navigate = useNavigate();
  useScreenViewChange();
  useBodyStyle(
    useMemo(
      () => ({
        backgroundColor: 'var(--neutral-100)',
      }),
      []
    )
  );

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

  return (
    <Routes>
      <Route
        path="/onboarding"
        element={
          <PageLayout>
            <Welcome />
          </PageLayout>
        }
      />
      <Route
        path="/onboarding/create/*"
        element={
          <PageLayout>
            <Create />
          </PageLayout>
        }
      />
      <Route
        path="/onboarding/backup/*"
        element={
          <PageLayout>
            <Backup />
          </PageLayout>
        }
      />
      <Route
        path="/onboarding/import/*"
        element={
          <PageLayout>
            <Import />
          </PageLayout>
        }
      />
      <Route path="/onboarding/hardware/*" element={<Hardware />} />
      <Route
        path="/onboarding/success"
        element={
          <PageLayout>
            <Success />
          </PageLayout>
        }
      />
      <Route
        path="/onboarding/session-expired"
        element={
          <PageLayout>
            <SessionExpired
              onRestart={
                existingUser ? () => navigate('/onboarding') : undefined
              }
            />
          </PageLayout>
        }
      />
    </Routes>
  );
}
