import { useEffect, useRef } from 'react';
import { useMutation } from 'react-query';
import { useLocation } from 'react-router-dom';
import { walletPort } from './channels';

export function useScreenViewChange() {
  const { pathname } = useLocation();
  const previousPathname = useRef<string | null>(null);

  const { mutate } = useMutation(
    async (pathname: string) => {
      const address = await walletPort.request('getCurrentAddress');
      return walletPort.request('screenView', {
        pathname,
        address,
        previous: previousPathname.current,
      });
    },
    {
      onSuccess() {
        previousPathname.current = pathname;
      },
    }
  );

  useEffect(() => {
    if (pathname !== '/') {
      mutate(pathname);
    }
  }, [mutate, pathname]);
}
