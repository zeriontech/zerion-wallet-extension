import React from 'react';
import { useMutation } from '@tanstack/react-query';
import type { NavigateOptions } from 'react-router-dom';
import { Route, Routes, useNavigate, useSearchParams } from 'react-router-dom';
import { invariant } from 'src/shared/invariant';
import { isSessionExpiredError } from 'src/ui/shared/isSessionExpiredError';
import { PageLayout } from 'src/ui/features/onboarding/shared/PageLayout';
import { walletPort } from 'src/ui/shared/channels';
import { Info } from './Info';
import { RecoveryPhrase } from './RecoveryPhrase';
import { VerifyBackup } from './VerifyBackup';
import { VerifyUser } from './VerifyUser';
import { Success } from './Success';

export function BackupComponent({
  groupId,
  onStart,
  onExit,
  onSkip,
  onSuccess,
  onSessionExpired,
}: {
  groupId?: string;
  onStart: () => void;
  onExit?: () => void;
  onSkip?: () => void;
  onSuccess: () => void;
  onSessionExpired: () => void;
}) {
  const navigate = useNavigate();
  const searchParams = groupId ? `?${new URLSearchParams({ groupId })}` : '';

  return (
    <Routes>
      <Route
        path="/"
        element={<Info onContinue={onStart} onSkip={onSkip} onExit={onExit} />}
      />
      <Route
        path="/verify-user"
        element={
          <VerifyUser
            onSuccess={() => navigate(`recovery-phrase${searchParams}`)}
          />
        }
      />
      <Route
        path="/recovery-phrase"
        element={
          <RecoveryPhrase
            groupId={groupId}
            onNextStep={() => navigate(`verify-backup${searchParams}`)}
            onSkip={onSkip}
            onSessionExpired={onSessionExpired}
          />
        }
      />
      <Route
        path="/verify-backup"
        element={
          <VerifyBackup
            groupId={groupId}
            onSessionExpired={onSessionExpired}
            onSuccess={onSuccess}
          />
        }
      />
      <Route path="/success" element={<Success />} />
    </Routes>
  );
}

export function BackupPage() {
  const [params] = useSearchParams();
  const groupId = params.get('groupId');
  invariant(groupId, 'groupId param is required for BackupPage');

  const navigate = useNavigate();

  const goToVerifyUser = (options?: NavigateOptions) =>
    navigate(`/backup/verify-user?groupId=${groupId}`, options);

  const { mutate: handleSuccess } = useMutation({
    mutationFn: () => walletPort.request('updateLastBackedUp', { groupId }),
    onSuccess: () => navigate(`/backup/success?groupId=${groupId}`),
    onError: (error: unknown) => {
      if (isSessionExpiredError(error)) {
        goToVerifyUser({ replace: true });
      }
    },
    useErrorBoundary: true,
  });

  return (
    <PageLayout>
      <BackupComponent
        groupId={groupId}
        onStart={goToVerifyUser}
        onSuccess={handleSuccess}
        onSessionExpired={() => goToVerifyUser({ replace: true })}
      />
    </PageLayout>
  );
}
