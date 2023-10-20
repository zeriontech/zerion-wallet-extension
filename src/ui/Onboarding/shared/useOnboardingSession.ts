import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser } from 'src/shared/getCurrentUser';
import { emitter } from 'src/ui/shared/events';

export function useOnboardingSession(
  navigateOnAccountCreated: 'session-expired' | 'overview'
) {
  const navigate = useNavigate();

  const { data: existingUser, isLoading } = useQuery({
    queryKey: ['getCurrentUser'],
    queryFn: async () => {
      const result = await getCurrentUser();
      return result || null;
    },
    suspense: false,
    refetchOnWindowFocus: true,
  });

  useEffect(() => {
    if (existingUser) {
      if (navigateOnAccountCreated === 'session-expired') {
        navigate('/onboarding/session-expired', { replace: true });
      } else {
        navigate('/overview');
        emitter.emit('reloadExtension');
      }
    }
  }, [existingUser, navigate, navigateOnAccountCreated]);

  return {
    sessionDataIsLoading: isLoading,
    hasExistingUser: Boolean(existingUser),
  };
}
