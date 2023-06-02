import { useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useLocation } from 'react-router-dom';
import { walletPort } from 'src/ui/shared/channels';

export function InactivityDetector() {
  /**
   * Send user heardbeat on
   * * initial mount
   * * clicks
   * * location change
   */
  const location = useLocation();
  const { mutate: sendHeartbeat } = useMutation(() =>
    walletPort.request('userHeartbeat')
  );

  useEffect(() => {
    function handler() {
      sendHeartbeat();
    }
    document.addEventListener('click', handler);
    return () => {
      document.removeEventListener('click', handler);
    };
  }, [sendHeartbeat]);

  useEffect(() => {
    // invoked both on mount and on location change
    sendHeartbeat();
  }, [location, sendHeartbeat]);

  return null;
}
