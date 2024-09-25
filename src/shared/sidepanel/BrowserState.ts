import browser from 'webextension-polyfill';

class BrowserState {
  currentWindowId?: number;
  initialWindowId?: number;

  constructor() {
    this.getInitialWindow();
    this.addListeners();
  }

  async getInitialWindow() {
    /**
     * There is an assumption here that when sidepanel gets opened, "current" window
     * MUST be the one which this sidepanel belongs to. Is this a correct assumption?
     */
    const currentWindow = await browser.windows.getCurrent();
    this.currentWindowId = currentWindow.id;
    this.initialWindowId = currentWindow.id;
  }

  addListeners() {
    browser.windows.onFocusChanged.addListener((windowId) => {
      this.currentWindowId = windowId;
    });
  }
}

export const browserState = new BrowserState();
