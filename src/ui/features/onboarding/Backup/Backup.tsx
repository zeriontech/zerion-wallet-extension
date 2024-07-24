import React, { useCallback } from 'react';
import { accountPublicRPCPort, walletPort } from 'src/ui/shared/channels';
import { setCurrentAddress } from 'src/ui/shared/requests/setCurrentAddress';
import { invariant } from 'src/shared/invariant';
import { getWalletGroupByAddress } from 'src/ui/shared/requests/getWalletGroupByAddress';
import { SessionExpired } from 'src/shared/errors/errors';
import { BackupComponent } from 'src/ui/pages/Backup/Backup';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { isSessionExpiredError } from 'src/ui/shared/isSessionExpiredError';

async function ensurePendingWalletAndUser() {
  const wallet = await walletPort.request('getPendingWallet');
  if (!wallet) {
    throw new SessionExpired();
  }
  await accountPublicRPCPort.request('saveUserAndWallet');
  await setCurrentAddress({ address: wallet.address });
  return wallet;
}

export function Backup() {
  const navigate = useNavigate();

  const handleError = (error: unknown) => {
    if (isSessionExpiredError(error)) {
      navigate('/onboarding/session-expired', { replace: true });
    }
  };

  const { mutate: handleSkip } = useMutation({
    mutationFn: () => ensurePendingWalletAndUser(),
    onSuccess: () => navigate('/onboarding/success'),
    onError: handleError,
    useErrorBoundary: true,
  });

  const { mutate: handleSuccess } = useMutation({
    mutationFn: async () => {
      const wallet = await ensurePendingWalletAndUser();
      const group = await getWalletGroupByAddress(wallet.address);
      invariant(group?.id, 'Saved wallet should belong to a group');
      await walletPort.request('updateLastBackedUp', { groupId: group.id });
    },
    onSuccess: () => navigate('/onboarding/success'),
    onError: handleError,
    useErrorBoundary: true,
  });

  const handleSessionExpired = useCallback(
    () => navigate('/onboarding/session-expired', { replace: true }),
    [navigate]
  );

  return (
    <BackupComponent
      groupId={null}
      onStart={() => navigate('/onboarding/backup/recovery-phrase')}
      onExit={() => navigate('/onboarding')}
      onSkip={handleSkip}
      onSuccess={handleSuccess}
      onSessionExpired={handleSessionExpired}
    />
  );
}
