import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { walletPort } from 'src/ui/shared/channels';

export function useRedirectToRestorePage() {
  const navigate = useNavigate();
  const { data } = useQuery({
    queryKey: ['restoreDataNeeded'],
    queryFn: () => walletPort.request('checkBackupData'),
    suspense: false,
  });

  useEffect(() => {
    if (data) {
      navigate('/restore-data', { replace: true });
    }
  }, [data, navigate]);
}
