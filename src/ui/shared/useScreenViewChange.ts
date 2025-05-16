import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { walletPort } from 'src/ui/shared/channels';
import { urlContext } from 'src/shared/UrlContext';

async function trackScreenView({
  event,
  pathname,
  previousPathname,
}: {
  event: 'screenView' | 'appOpened';
  pathname: string;
  previousPathname: string | null;
}) {
  const address = await walletPort.request('getCurrentAddress');
  return walletPort.request(event, {
    pathname,
    address,
    previous: previousPathname,
    screenSize: `${window.screen.width}x${window.screen.height}`,
    windowType: urlContext.windowType,
  });
}

export function useScreenViewChange() {
  const { pathname } = useLocation();
  const previousPathname = useRef<string | null>(null);

  const didTrackAppOpened = useRef(false);
  useEffect(() => {
    if (pathname === '/') {
      return;
    }
    trackScreenView({
      event: 'screenView',
      pathname,
      previousPathname: previousPathname.current,
    });
    if (!didTrackAppOpened.current) {
      trackScreenView({
        event: 'appOpened',
        pathname,
        previousPathname: previousPathname.current,
      });
      didTrackAppOpened.current = true;
    }
    previousPathname.current = pathname;
  }, [pathname]);
}

export function ScreenViewChangeTracker() {
  useScreenViewChange();
  return null;
}
