import React from 'react';
import { useMutation } from '@tanstack/react-query';
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { accountPublicRPCPort, walletPort } from 'src/ui/shared/channels';
import { setCurrentAddress } from 'src/ui/shared/requests/setCurrentAddress';
import { getWalletGroupByAddress } from 'src/ui/shared/requests/getWalletGroupByAddress';
import { invariant } from 'src/shared/invariant';
import { zeroizeAfterSubmission } from 'src/ui/shared/zeroize-submission';
import { isSessionExpiredError } from '../shared/isSessionExpiredError';
import { useOnboardingSession } from '../shared/useOnboardingSession';
import { Cards } from './Cards';
import { CreatePassword } from './CreatePassword';
import { Backup } from './Backup';
import { VerifyBackup } from './VerifyBackup';

class LostPendingWalletError extends Error {}

export function Create() {
  const navigate = useNavigate();

  const { mutate: handleSkipFlow } = useMutation({
    mutationFn: async () => {
      const wallet = await walletPort.request('getPendingWallet');
      if (!wallet) {
        throw new LostPendingWalletError();
      }
      await accountPublicRPCPort.request('saveUserAndWallet');
      await setCurrentAddress({ address: wallet.address });
    },
    onSuccess: () => {
      zeroizeAfterSubmission();
      navigate('/onboarding/success');
    },
    onError: (e) => {
      if (isSessionExpiredError(e) || e instanceof LostPendingWalletError) {
        navigate('/onboarding/session-expired', { replace: true });
      }
    },
    useErrorBoundary: true,
  });

  const { mutate: handleCompleteFlow } = useMutation({
    mutationFn: async () => {
      const wallet = await walletPort.request('getPendingWallet');
      if (!wallet) {
        throw new LostPendingWalletError();
      }
      await accountPublicRPCPort.request('saveUserAndWallet');
      await setCurrentAddress({ address: wallet.address });
      const group = await getWalletGroupByAddress(wallet.address);
      invariant(group?.id, 'Saved wallet should belong to a group');
      await walletPort.request('updateLastBackedUp', { groupId: group.id });
    },
    onSuccess: () => {
      zeroizeAfterSubmission();
      navigate('/onboarding/success');
    },
    onError: (e) => {
      if (isSessionExpiredError(e) || e instanceof LostPendingWalletError) {
        navigate('/onboarding/session-expired', { replace: true });
      }
    },
    useErrorBoundary: true,
  });

  const { sessionDataIsLoading } = useOnboardingSession('session-expired');

  if (sessionDataIsLoading) {
    return null;
  }

  return (
    <Routes>
      <Route path="/" element={<Navigate to={'password'} replace={true} />} />
      <Route
        path="/password"
        element={
          <CreatePassword
            onCreate={() => navigate('info')}
            onExit={() => navigate('/onboarding')}
          />
        }
      />
      <Route
        path="/info"
        element={
          <Cards
            onExit={() => navigate('/onboarding')}
            onContinue={() => navigate('backup')}
            onSkip={() => handleSkipFlow()}
          />
        }
      />
      <Route
        path="/backup"
        element={
          <Backup
            onNextStep={() => navigate('verify')}
            onSkip={() => handleSkipFlow()}
          />
        }
      />
      <Route
        path="/verify"
        element={<VerifyBackup onSuccess={handleCompleteFlow} />}
      />
    </Routes>
  );
}
