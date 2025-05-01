import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { isObj } from 'src/shared/isObj';
import { walletPort } from 'src/ui/shared/channels';
import { emitter } from 'src/ui/shared/events';

export function SessionResetHandler() {
  const navigate = useNavigate();
  const location = useLocation();
  const pathnameRef = useRef(location.pathname);
  pathnameRef.current = location.pathname;
  useEffect(() => {
    function messageHandler(message: unknown) {
      if (isObj(message) && message.payload === 'session-logout') {
        emitter.emit('sessionLogout');
        if (
          pathnameRef.current !== '/login' &&
          !pathnameRef.current.endsWith('/change-password')
        ) {
          navigate('/login');
        }
      }
    }
    const { port } = walletPort;
    if (port) {
      port.onMessage.addListener(messageHandler);
      return () => {
        port.onMessage.removeListener(messageHandler);
      };
    }
  }, [navigate]);
  return null;
}
