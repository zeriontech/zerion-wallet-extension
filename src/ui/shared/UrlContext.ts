export type AppMode = 'onboarding' | 'wallet';
export type WindowType = 'popup' | 'tab' | 'dialog';
export type WindowLayout = 'column' | 'page';

export enum UrlContextParam {
  windowType = 'windowType',
  windowLayout = 'windowLayout',
  appMode = 'appMode',
}

function getSearchParam<T>(param: UrlContextParam, defaultValue: T) {
  const url = new URL(window.location.href);
  return (url.searchParams.get(param) as T) || defaultValue;
}

export interface UrlContextParams {
  appMode?: AppMode;
  windowType?: WindowType;
  windowLayout?: WindowLayout;
}

class UrlContext {
  set(searchParams: URLSearchParams, params: UrlContextParams) {
    if (params.windowLayout) {
      searchParams.set(UrlContextParam.windowLayout, params.windowLayout);
    }
    if (params.windowType) {
      searchParams.set(UrlContextParam.windowType, params.windowType);
    }
    if (params.appMode) {
      searchParams.set(UrlContextParam.appMode, params.appMode);
    }
  }
}

export class WindowContext {
  getWindowType() {
    return getSearchParam(UrlContextParam.windowType, 'popup');
  }

  getWindowLayout() {
    return getSearchParam(UrlContextParam.windowLayout, 'column');
  }

  isPopup() {
    return this.getWindowType() === 'popup';
  }

  isDialog() {
    return this.getWindowType() === 'dialog';
  }

  isTab() {
    return this.getWindowType() === 'tab';
  }

  hasPageLayout() {
    return this.getWindowLayout() === 'page';
  }

  hasColumnLayout() {
    return this.getWindowLayout() === 'column';
  }
}

export class AppContext {
  getAppMode() {
    return getSearchParam(UrlContextParam.appMode, 'wallet');
  }

  isOnboardingMode() {
    return this.getAppMode() === 'onboarding';
  }

  isWalletMode() {
    return this.getAppMode() === 'wallet';
  }
}

export const urlContext = new UrlContext();
export const appContext = new AppContext();
export const windowContext = new WindowContext();
