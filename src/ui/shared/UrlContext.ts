type AppMode = 'onboarding' | 'wallet';
type WindowLayout = 'column' | 'page';
type WindowType = 'popup' | 'tab' | 'dialog';

export enum UrlContextParam {
  windowType = 'windowType',
  windowLayout = 'windowLayout',
  appMode = 'appMode',
}

export interface UrlContext {
  appMode: AppMode;
  windowType: WindowType;
  windowLayout: WindowLayout;
}

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
