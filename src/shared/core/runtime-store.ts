import { Store } from 'store-unit';
import type Browser from 'webextension-polyfill';

type State = {
  connected: boolean;
  /**
   * Supposedly, this event happens when browser starts, but doesn't happen when
   * background script of the extension reloads. If so, we can use this event to
   * detect background script restarts
   * https://developer.chrome.com/docs/extensions/reference/api/runtime#event-onStartup
   */
  startupEvent: null | number;
  installedEvent: null | {
    reason: Browser.Runtime.OnInstalledReason;
    timestamp: number;
  };
};

class RuntimeStore extends Store<State> {
  handleStartupEvent() {
    this.setState((state) => ({ ...state, startupEvent: Date.now() }));
  }

  handleInstalledEvent(details: { reason: Browser.Runtime.OnInstalledReason }) {
    this.setState((state) => ({
      ...state,
      installedEvent: { reason: details.reason, timestamp: Date.now() },
    }));
  }
}

export const runtimeStore = new RuntimeStore({
  connected: true,
  startupEvent: null,
  installedEvent: null,
});
