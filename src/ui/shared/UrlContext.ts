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

function getSearchParam<T>(param: UrlContextParam, defaultValue: T) {
  const url = new URL(window.location.href);
  return (url.searchParams.get(param) as T) || defaultValue;
}

export const urlContext: UrlContext = {
  appMode: getSearchParam(UrlContextParam.appMode, 'wallet'),
  windowType: getSearchParam(UrlContextParam.windowType, 'popup'),
  windowLayout: getSearchParam(UrlContextParam.windowLayout, 'column'),
};
