import React, { useEffect, useMemo } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { useBodyStyle } from 'src/ui/components/Background/Background';
import { useScreenViewChange } from 'src/ui/shared/useScreenViewChange';
import { DelayedRender } from 'src/ui/components/DelayedRender';
import { setAnalyticsIdIfNeeded } from 'src/shared/analytics/analyticsId.client';
import { WebAppMessageHandler } from '../referral-program/WebAppMessageHandler';
import { Success } from './Success';
import { Welcome } from './Welcome';
import { Import } from './Import';
import { CreateUser } from './CreateUser';
import { Hardware } from './Hardware';
import { SessionExpired } from './shared/SessionExpired';
import { PageLayout } from './shared/PageLayout';
import { Backup } from './Backup';

function AnalyticsUserIdFallback() {
  useEffect(() => {
    const id = crypto.randomUUID();
    setAnalyticsIdIfNeeded(id);
  }, []);
  return null;
}

function AnalyticsUserIdHandler() {
  return (
    <>
      <DelayedRender delay={5000}>
        <AnalyticsUserIdFallback />
      </DelayedRender>
      <WebAppMessageHandler
        pathname="/user-id"
        callbackName="set-user-id"
        callbackFn={(userId) => {
          setAnalyticsIdIfNeeded(userId as string);
        }}
        hidden={true}
      />
    </>
  );
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
    <>
      <AnalyticsUserIdHandler />
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
    </>
  );
}
