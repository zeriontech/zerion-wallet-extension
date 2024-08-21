export type AppMode = 'onboarding' | 'wallet';
export type WindowLayout = 'column' | 'page';
export type WindowType = 'popup' | 'tab' | 'dialog' | 'sidepanel';

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
