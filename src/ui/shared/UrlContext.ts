export type AppMode = 'onboarding' | 'wallet';
export type WindowType = 'popup' | 'tab' | 'dialog';
export type WindowLayout = 'column' | 'page';

export enum UrlContextParam {
  windowType = 'windowType',
  windowLayout = 'windowLayout',
  appMode = 'appMode',
}

function getUrlContextParam<T>(param: UrlContextParam, defaultValue?: T) {
  const url = new URL(window.location.href);
  return (url.searchParams.get(param) as T) || defaultValue;
}

export interface UrlContextParams {
  appMode?: AppMode;
  windowType?: WindowType;
  windowLayout?: WindowLayout;
}

class UrlContext {
  private params: UrlContextParams;

  constructor(params: UrlContextParams) {
    this.params = params;
  }

  set(searchParams: URLSearchParams, params: UrlContextParams) {
    if (params.windowLayout) {
      searchParams.set(UrlContextParam.windowLayout, params.windowLayout);
      this.params.windowLayout = params.windowLayout;
    }
    if (params.windowType) {
      searchParams.set(UrlContextParam.windowType, params.windowType);
      this.params.windowType = params.windowType;
    }
    if (params.appMode) {
      searchParams.set(UrlContextParam.appMode, params.appMode);
      this.params.appMode = params.appMode;
    }
  }
}

export class WindowContext {
  private params: UrlContextParams;

  constructor(params: UrlContextParams) {
    this.params = params;
  }

  isPopup() {
    return this.params.windowType === 'popup';
  }

  isDialog() {
    return this.params.windowType === 'dialog';
  }

  isTab() {
    return this.params.windowType === 'tab';
  }

  hasPageLayout() {
    return this.params.windowLayout === 'page';
  }

  hasColumnLayout() {
    return this.params.windowLayout === 'column';
  }
}

export class AppContext {
  private params: UrlContextParams;

  constructor(params: UrlContextParams) {
    this.params = params;
  }

  isOnboardingMode() {
    return this.params.appMode === 'onboarding';
  }

  isWalletMode() {
    return this.params.appMode === 'wallet';
  }
}

const params: UrlContextParams = {
  appMode: getUrlContextParam(UrlContextParam.appMode, 'wallet'),
  windowType: getUrlContextParam(UrlContextParam.windowType, 'popup'),
  windowLayout: getUrlContextParam(UrlContextParam.windowLayout, 'column'),
};

export const urlContext = new UrlContext(params);
export const appContext = new AppContext(params);
export const windowContext = new WindowContext(params);
