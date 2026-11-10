import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { walletPort } from 'src/ui/shared/channels';

export function useRedirectToRestorePage() {
  const navigate = useNavigate();
  const { data } = useQuery({
    queryKey: ['restoreDataNeeded'],
    queryFn: () => walletPort.request('checkBackupData'),
  });

  useEffect(() => {
    if (data) {
      navigate('/restore-data', { replace: true });
    }
  }, [data, navigate]);
}
