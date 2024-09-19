export type AppMode = 'onboarding' | 'wallet' | 'newTab';
export type WindowLayout = 'column' | 'page';
export type WindowType = 'popup' | 'tab' | 'dialog';

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
