import { Store } from 'store-unit';
import type Browser from 'webextension-polyfill';

type OnInstalledDetails = Pick<
  Browser.Runtime.OnInstalledDetailsType,
  'reason' | 'previousVersion'
>;

type State = {
  connected: boolean;
  /**
   * Supposedly, this event happens when browser starts, but doesn't happen when
   * background script of the extension reloads. If so, we can use this event to
   * detect background script restarts
   * https://developer.chrome.com/docs/extensions/reference/api/runtime#event-onStartup
   */
  startupEvent: null | number;
  installedEvent: null | (OnInstalledDetails & { timestamp: number });
};

class RuntimeStore extends Store<State> {
  handleStartupEvent() {
    this.setState((state) => ({ ...state, startupEvent: Date.now() }));
  }

  handleInstalledEvent({ reason, previousVersion }: OnInstalledDetails) {
    this.setState((state) => ({
      ...state,
      installedEvent: { reason, previousVersion, timestamp: Date.now() },
    }));
  }
}

export const runtimeStore = new RuntimeStore({
  connected: true,
  startupEvent: null,
  installedEvent: null,
});
