export type AppMode = 'onboarding' | 'wallet';
export type WindowType = 'popup' | 'tab' | 'dialog';
export type WindowLayout = 'column' | 'page';

export enum WindowParam {
  windowType = 'windowType',
  windowLayout = 'windowLayout',
  appMode = 'appMode',
}

export function getWindowParam<T>(param: WindowParam, defaultValue?: T) {
  const url = new URL(window.location.href);
  return (url.searchParams.get(param) as T) || defaultValue;
}

export function setAppMode(params: URLSearchParams, value: AppMode) {
  params.set(WindowParam.appMode, value);
}

export function setWindowType(params: URLSearchParams, value: WindowType) {
  params.set(WindowParam.windowType, value);
}

export function setWindowLayout(params: URLSearchParams, value: WindowLayout) {
  params.set(WindowParam.windowLayout, value);
}
