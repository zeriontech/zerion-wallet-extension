import React from 'react';
import { useMutation } from '@tanstack/react-query';
import {
  Navigate,
  Route,
  Routes,
  useNavigate,
  useSearchParams,
} from 'react-router-dom';
import { accountPublicRPCPort, walletPort } from 'src/ui/shared/channels';
import { setCurrentAddress } from 'src/ui/shared/requests/setCurrentAddress';
import { getWalletGroupByAddress } from 'src/ui/shared/requests/getWalletGroupByAddress';
import { invariant } from 'src/shared/invariant';
import { zeroizeAfterSubmission } from 'src/ui/shared/zeroize-submission';
import { isSessionExpiredError } from 'src/ui/shared/isSessionExpiredError';
import { Info } from './Info';
import { RecoveryPhrase } from './RecoveryPhrase';
import { VerifyBackup } from './VerifyBackup';

class LostPendingWalletError extends Error {}

export function Backup() {
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
      // const wallet = walletPort.request('uiGetWalletGroup', { groupId });
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

  const [params] = useSearchParams();
  const groupId = params.get('groupId');
  const searchParams = groupId ? `?${new URLSearchParams({ groupId })}` : '';

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
            onContinue={() => navigate(`recovery-phrase${searchParams}`)}
            onSkip={() => handleSkipFlow()}
            onExit={() => navigate('/onboarding')}
          />
        }
      />
      <Route
        path="/recovery-phrase"
        element={
          <RecoveryPhrase
            onNextStep={() => navigate(`verify${searchParams}`)}
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
