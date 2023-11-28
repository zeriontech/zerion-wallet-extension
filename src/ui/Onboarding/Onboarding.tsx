import React, { useMemo } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useScreenViewChange } from '../shared/useScreenViewChange';
import { useBodyStyle } from '../components/Background/Background';
import { Welcome } from './Welcome';
import { Import } from './Import';
import { Success } from './Success';
import { Create } from './Create';
import { Hardware } from './Hardware';
import { PageLayout } from './shared/PageLayout/PageLayout';
import { SessionExpired } from './shared/SessionExpired';

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
