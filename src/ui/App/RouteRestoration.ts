import { useQuery } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { BrowserStorage } from 'src/background/webapis/storage';

const restorationWhiteList = new Set<string>();

export function registerPersistentRoute(value: string) {
  restorationWhiteList.add(value);
}

export async function resetPersistedRoutes() {
  return BrowserStorage.remove('routeRestoration');
}

export function RouteRestoration({ initialRoute }: { initialRoute?: string }) {
  const { pathname, search } = useLocation();
  const didRestoreRef = useRef(false);
  const { data: destination, isSuccess } = useQuery({
    queryKey: ['routeRestoration'],
    queryFn: async () => {
      const result = await BrowserStorage.get<string>('routeRestoration');
      return result || null;
    },
    staleTime: Infinity,
    enabled: !initialRoute,
  });
  useEffect(() => {
    if (!isSuccess) {
      // only record routes after initialization
      return;
    }
    if (restorationWhiteList.has(pathname)) {
      const destination = search ? `${pathname}?${search}` : pathname;
      BrowserStorage.set('routeRestoration', destination);
    } else {
      BrowserStorage.remove('routeRestoration');
    }
  }, [pathname, search, isSuccess]);
  if (initialRoute) {
    return null;
  }
  if (destination && !didRestoreRef.current) {
    didRestoreRef.current = true;
    window.location.hash = destination;
  }
  return null;
}
