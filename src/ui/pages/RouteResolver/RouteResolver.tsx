import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Splash } from 'src/ui/components/Splash';
import { accountPublicRPCPort, walletPort } from 'src/ui/shared/channels';
import { getPageTemplateName } from 'src/ui/shared/getPageTemplateName';

const templateName = getPageTemplateName();

export function RouteResolver({
  children,
}: React.PropsWithChildren<Record<string, unknown>>) {
  const location = useLocation();
  const navigate = useNavigate();
  const [ready, setReady] = useState(templateName === '/dialog.html');
  const { pathname } = location;
  console.log('RouteResolver', pathname, { templateName });

  const ARTIFICAL_WAIT_TIME = 0;
  useEffect(() => {
    if (ready) {
      return;
    }
    async function resolve() {
      if (ARTIFICAL_WAIT_TIME > 0) {
        await new Promise((r) => setTimeout(r, 300));
      }
      const isAuthenticated = await accountPublicRPCPort.request(
        'isAuthenticated'
      );
      const existingUser = await accountPublicRPCPort.request(
        'getExistingUser'
      );
      console.log({ isAuthenticated, existingUser });

      if (!isAuthenticated) {
        if (existingUser) {
          navigate('/login');
        } else {
          console.log('navigating to /');
          navigate('/');
        }
        setReady(true);
        return;
      }
      const currentWallet = await walletPort.request('getCurrentWallet');
      console.log({ currentWallet });
      if (pathname === '/') {
        if (currentWallet) {
          navigate('/overview');
        }
      }
      setReady(true);
    }

    resolve();
  }, [navigate, pathname, ready]);

  if (!ready) {
    return ARTIFICAL_WAIT_TIME > 0 ? <Splash /> : null;
  }
  return children as React.ReactElement;
}
