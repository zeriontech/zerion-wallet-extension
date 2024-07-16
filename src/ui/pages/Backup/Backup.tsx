import React, { useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { accountPublicRPCPort, walletPort } from 'src/ui/shared/channels';
import { setCurrentAddress } from 'src/ui/shared/requests/setCurrentAddress';
import { getWalletGroupByAddress } from 'src/ui/shared/requests/getWalletGroupByAddress';
import { invariant } from 'src/shared/invariant';
import { zeroizeAfterSubmission } from 'src/ui/shared/zeroize-submission';
import { isSessionExpiredError } from 'src/ui/shared/isSessionExpiredError';
import { SessionExpired } from 'src/shared/errors/errors';
import { Info } from './Info';
import { RecoveryPhrase } from './RecoveryPhrase';
import { VerifyBackup } from './VerifyBackup';
import { VerifyUser } from './VerifyUser';
import { Success } from './Success';
import type { BackupContext } from './useBackupContext';
import { useBackupContext } from './useBackupContext';

async function completeBackup(backupContext: BackupContext) {
  if (backupContext.appMode === 'onboarding') {
    const wallet = await walletPort.request('getPendingWallet');
    if (!wallet) {
      throw new SessionExpired();
    }
    await accountPublicRPCPort.request('saveUserAndWallet');
    await setCurrentAddress({ address: wallet.address });
    const group = await getWalletGroupByAddress(wallet.address);
    invariant(group?.id, 'Saved wallet should belong to a group');
    await walletPort.request('updateLastBackedUp', { groupId: group.id });
  } else {
    await walletPort.request('updateLastBackedUp', {
      groupId: backupContext.groupId,
    });
  }
}

export function Backup() {
  const navigate = useNavigate();
  const backupContext = useBackupContext();

  const handleSessionExpired = useCallback(() => {
    if (backupContext.appMode === 'onboarding') {
      navigate('/onboarding/session-expired', { replace: true });
    } else {
      navigate(`/backup/verify-user?groupId=${backupContext.groupId}`, {
        replace: true,
      });
    }
  }, [backupContext, navigate]);

  const handleSuccess = useCallback(() => {
    zeroizeAfterSubmission();
    if (backupContext.appMode === 'onboarding') {
      navigate('/onboarding/success');
    } else {
      navigate(`/backup/success?groupId=${backupContext.groupId}`);
    }
  }, [backupContext, navigate]);

  const handleError = useCallback(
    (error: unknown) => {
      if (isSessionExpiredError(error)) {
        navigate('/onboarding/session-expired', { replace: true });
      }
    },
    [navigate]
  );

  const { mutate: handleSkipBackup } = useMutation({
    mutationFn: async () => {
      invariant(
        backupContext.appMode === 'onboarding',
        'Must be in onboarding appMode'
      );
      const wallet = await walletPort.request('getPendingWallet');
      if (!wallet) {
        throw new SessionExpired();
      }
      await accountPublicRPCPort.request('saveUserAndWallet');
      await setCurrentAddress({ address: wallet.address });
    },
    onSuccess: handleSuccess,
    onError: handleError,
    useErrorBoundary: true,
  });

  const { mutate: handleCompleteBackup } = useMutation({
    mutationFn: () => completeBackup(backupContext),
    onSuccess: handleSuccess,
    onError: handleError,
    useErrorBoundary: true,
  });

  const searchParams =
    backupContext.appMode === 'wallet'
      ? `?${new URLSearchParams({ groupId: backupContext.groupId })}`
      : '';

  return (
    <Routes>
      <Route
        path="/"
        element={
          <Navigate
            to={{ pathname: 'info', search: searchParams }}
            replace={true}
          />
        }
      />
      <Route
        path="/info"
        element={
          <Info
            onContinue={() =>
              backupContext.appMode === 'onboarding'
                ? navigate('recovery-phrase')
                : navigate(`/backup/verify-user${searchParams}`)
            }
            onSkip={handleSkipBackup}
            onExit={() => navigate('/onboarding')}
          />
        }
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
            onSessionExpired={handleSessionExpired}
            onNextStep={() => navigate(`verify-backup${searchParams}`)}
            onSkip={handleSkipBackup}
          />
        }
      />
      <Route
        path="/verify-backup"
        element={
          <VerifyBackup
            onSessionExpired={handleSessionExpired}
            onSuccess={handleCompleteBackup}
          />
        }
      />
      <Route path="/success" element={<Success />} />
    </Routes>
  );
}
