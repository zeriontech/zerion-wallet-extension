import type {
  AppMode,
  UrlContext,
  WindowLayout,
  WindowType,
} from './types/UrlContext';
import { UrlContextParam } from './types/UrlContext';

function getUrlContext(): UrlContext {
  const params = new URL(window.location.href).searchParams;
  return {
    appMode: (params.get(UrlContextParam.appMode) as AppMode) || 'wallet',
    windowType:
      (params.get(UrlContextParam.windowType) as WindowType) || 'popup',
    windowLayout:
      (params.get(UrlContextParam.windowLayout) as WindowLayout) || 'column',
  };
}

export const urlContext = getUrlContext();
