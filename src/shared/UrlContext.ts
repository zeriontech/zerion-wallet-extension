import type {
  AppMode,
  UrlContext,
  WindowLayout,
  WindowType,
} from './types/UrlContext';
import { UrlContextParam } from './types/UrlContext';

function getWindowType(params: URLSearchParams): WindowType {
  if (window.location.pathname.startsWith('/sidepanel')) {
    return 'sidepanel';
  }
  return (params.get(UrlContextParam.windowType) as WindowType) || 'popup';
}

function getUrlContext(): UrlContext {
  const params = new URL(window.location.href).searchParams;
  return {
    appMode: (params.get(UrlContextParam.appMode) as AppMode) || 'wallet',
    windowType: getWindowType(params),
    // (params.get(UrlContextParam.windowType) as WindowType) || 'popup',
    windowLayout:
      (params.get(UrlContextParam.windowLayout) as WindowLayout) || 'column',
  };
}

export const urlContext = getUrlContext();
