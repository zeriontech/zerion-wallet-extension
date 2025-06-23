import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { SessionStorage } from 'src/background/webapis/storage';

const restorationWhiteList = new Set<string>();

export function registerPersistentRoute(value: string) {
  restorationWhiteList.add(value);
}

export async function resetPersistedRoutes() {
  return SessionStorage.remove('routeRestoration');
}

export async function restoreRoute() {
  const result = await SessionStorage.get<string>('routeRestoration');
  if (result) {
    window.location.hash = result;
  }
}

export function RouteRestoration() {
  const { pathname, search } = useLocation();
  useEffect(() => {
    if (restorationWhiteList.has(pathname)) {
      const destination = search
        ? `${pathname}?${new URLSearchParams(search)}`
        : pathname;
      SessionStorage.set('routeRestoration', destination);
    } else {
      SessionStorage.remove('routeRestoration');
    }
  }, [pathname, search]);
  return null;
}
