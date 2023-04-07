import { useEffect, useRef } from 'react';
import { useMutation } from 'react-query';
import { useLocation } from 'react-router-dom';
import { walletPort } from './channels';

export function useScreenViewChange() {
  const { pathname } = useLocation();
  const previousPathname = useRef<string | null>(null);

  // TODO:
  // Refactor to NOT use useMutation, because useMutation makes the hook rerender
  // for changes to isLoading, isSuccess, etc, and we do not need these updates here.
  // But you need to make sure that the "previous" param sent to analytics is correct.
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
