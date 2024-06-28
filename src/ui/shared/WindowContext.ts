import type { AppMode, WindowLayout, WindowType } from './WindowParam';
import { WindowParam, getWindowParam } from './WindowParam';

export class WindowContextParams {
  appMode?: AppMode;
  windowType?: WindowType;
  windowLayout?: WindowLayout;
}

export class WindowContext {
  readonly params: WindowContextParams;

  constructor(params: WindowContextParams) {
    this.params = params;
  }

  isOnboardingMode() {
    return this.params.appMode === 'onboarding';
  }

  isWalletMode() {
    return this.params.appMode === 'wallet';
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

export const windowContext = new WindowContext({
  appMode: getWindowParam(WindowParam.appMode, 'wallet'),
  windowType: getWindowParam(WindowParam.windowType, 'popup'),
  windowLayout: getWindowParam(WindowParam.windowLayout, 'column'),
});
