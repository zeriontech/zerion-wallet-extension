import React from 'react';
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

  const searchParams =
    backupContext.appMode === 'wallet'
      ? `?${new URLSearchParams({ groupId: backupContext.groupId })}`
      : '';

  const { mutate: handleSkipFlow } = useMutation({
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
    onSuccess: () => {
      zeroizeAfterSubmission();
      navigate('/onboarding/success');
    },
    onError: (e) => {
      if (isSessionExpiredError(e)) {
        navigate('/onboarding/session-expired', { replace: true });
      }
    },
    useErrorBoundary: true,
  });

  const { mutate: handleCompleteFlow } = useMutation({
    mutationFn: () => completeBackup(backupContext),
    onSuccess: () => {
      zeroizeAfterSubmission();
      if (backupContext.appMode === 'onboarding') {
        navigate('/onboarding/success');
      } else {
        navigate(`/backup/success${searchParams}`);
      }
    },
    onError: (e) => {
      if (isSessionExpiredError(e)) {
        if (backupContext.appMode === 'onboarding') {
          navigate('/onboarding/session-expired', { replace: true });
        } else {
          navigate(`/backup/verify-user${searchParams}`, { replace: true });
        }
      }
    },
    useErrorBoundary: true,
  });

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
            onSkip={() => handleSkipFlow()}
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
            onNextStep={() => navigate(`verify-backup${searchParams}`)}
            onSkip={() => handleSkipFlow()}
          />
        }
      />
      <Route
        path="/verify-backup"
        element={<VerifyBackup onSuccess={handleCompleteFlow} />}
      />
      <Route path="/success" element={<Success />} />
    </Routes>
  );
}
