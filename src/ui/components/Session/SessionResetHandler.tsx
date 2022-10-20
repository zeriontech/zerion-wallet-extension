import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { walletPort } from 'src/ui/shared/channels';

export function SessionResetHandler() {
  const navigate = useNavigate();
  const location = useLocation();
  const pathnameRef = useRef(location.pathname);
  pathnameRef.current = location.pathname;
  useEffect(() => {
    function messageHandler(message: unknown) {
      if (message === 'session-logout') {
        if (pathnameRef.current !== '/login') {
          navigate('/login');
        }
      }
    }
    walletPort.port.onMessage.addListener(messageHandler);
    return () => {
      walletPort.port.onMessage.removeListener(messageHandler);
    };
  }, [navigate]);
  return null;
}
