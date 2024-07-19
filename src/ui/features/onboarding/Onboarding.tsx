import React, { useMemo } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useBodyStyle } from 'src/ui/components/Background/Background';
import { useScreenViewChange } from 'src/ui/shared/useScreenViewChange';
import { Backup } from 'src/ui/pages/Backup';
import { Success } from './Success';
import { Welcome } from './Welcome';
import { Import } from './Import';
import { Create } from './Create';
import { Hardware } from './Hardware';
import { SessionExpired } from './shared/SessionExpired';
import { PageLayout } from './shared/PageLayout';

function EmptyRoute() {
  return null;
}

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

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/onboarding" replace={true} />} />
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
            <SessionExpired onSubmit={() => navigate('/onboarding')} />
          </PageLayout>
        }
      />
      <Route path="/overview" element={<EmptyRoute />} />
      <Route path="*" element={<Navigate to="/onboarding" replace={true} />} />
    </Routes>
  );
}
