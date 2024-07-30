import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser } from 'src/shared/getCurrentUser';
import { emitter } from 'src/ui/shared/events';

export function useOnboardingSession({
  navigateOnExistingUser,
}: {
  navigateOnExistingUser: 'session-expired' | 'success';
}) {
  const navigate = useNavigate();

  const { data: existingUser, isLoading } = useQuery({
    queryKey: ['getCurrentUser'],
    queryFn: async () => {
      const result = await getCurrentUser();
      return result || null;
    },
    suspense: false,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (existingUser) {
      if (navigateOnExistingUser === 'session-expired') {
        navigate('/onboarding/session-expired', { replace: true });
      } else {
        navigate('/onboarding/success');
        emitter.emit('reloadExtension');
      }
    }
  }, [existingUser, navigate, navigateOnExistingUser]);

  return {
    sessionDataIsLoading: isLoading,
  };
}
