import React, { useMemo } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { useBodyStyle } from 'src/ui/components/Background/Background';
import { ScreenViewChangeTracker } from 'src/ui/shared/useScreenViewChange';
import { Success } from './Success';
import { Welcome } from './Welcome';
import { Import } from './Import';
import { CreateUser } from './CreateUser';
import { Hardware } from './Hardware';
import { SessionExpired } from './shared/SessionExpired';
import { PageLayout } from './shared/PageLayout';
import { Backup } from './Backup';

export function Onboarding() {
  const navigate = useNavigate();
  useBodyStyle(
    useMemo(
      () => ({
        backgroundColor: 'var(--neutral-100)',
      }),
      []
    )
  );

  return (
    <Routes>
      <ScreenViewChangeTracker />
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
            <CreateUser />
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
            <SessionExpired onRestart={() => navigate('/onboarding')} />
          </PageLayout>
        }
      />
    </Routes>
  );
}
