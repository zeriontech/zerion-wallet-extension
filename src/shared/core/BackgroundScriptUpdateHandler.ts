import browser from 'webextension-polyfill';

export class BackgroundScriptUpdateHandler {
  /**
   * Problem: background script disconnects and reactivates on its own and we can't control that
   * When it disconnects, "port channels" (this is how UI talks to the background script)
   * need to be re-initialized in order to connect to the latest version of the background script
   * When we detect that the background script got reactivated, we re-initialize the whole UI
   */
  constructor({ onActivate }: { onActivate: () => void }) {
    browser.runtime.onMessage.addListener((request) => {
      if (request.event === 'background-initialized') {
        // this is a custom event that we emit from the background-script
        // If we catch this event in the UI thread, we MUST re-initialize the UI
        onActivate();
      }
    });
  }

  keepAlive() {
    // runtime.connect() re-activates background script
    const port = browser.runtime.connect({ name: 'status-check-port' });
    if (port.error) {
      return;
    }
    port.onDisconnect.addListener(() => {
      // This means that the background-script (service-worker) went to sleep
      // We "wake" it up by creating a new runtime connection
      this.keepAlive();
    });
  }
}
