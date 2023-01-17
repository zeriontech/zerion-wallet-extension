import browser from 'webextension-polyfill';
import * as browserStorage from 'src/background/webapis/storage';

function getRandomInteger() {
  return window.crypto.getRandomValues(new Uint32Array(1))[0];
}

async function sendPortMessage<Req, Resp>(
  port: browser.Runtime.Port,
  request: Req
) {
  return new Promise<Resp>((resolve, reject) => {
    const onMessage = (response: Resp) => {
      port.onMessage.removeListener(onMessage);
      port.onDisconnect.removeListener(reject);
      resolve(response);
    };
    port.onMessage.addListener(onMessage);
    port.onDisconnect.addListener(reject);
    port.postMessage(request);
  });
}

const rejectAfterDelay = (ms: number) =>
  new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('Request timed out')), ms)
  );

const PERFORM_HANSHAKE_CHECK = false;

export class BackgroundScriptUpdateHandler {
  /**
   * Problem: background script disconnects and reactivates on its own and we can't control that
   * When it disconnects, "port channels" (this is how UI talks to the background script)
   * need to be re-initialized in order to connect to the latest version of the background script
   * When we detect that the background script got reactivated, we re-initialize the whole UI
   */

  private onActivate: () => void;
  private onFailedHandshake: () => void;

  constructor({
    onActivate,
    onFailedHandshake,
  }: {
    onActivate: () => void;
    onFailedHandshake: () => void;
  }) {
    this.onActivate = onActivate;
    this.onFailedHandshake = onFailedHandshake;
    browser.runtime.onMessage.addListener((request) => {
      if (request.event === 'background-initialized') {
        // this is a custom event that we emit from the background-script
        // If we catch this event in the UI thread, we MUST re-initialize the UI
        this.onActivate();
      }
    });
  }

  private async handleHandshakeFail() {
    console.warn('Failed handshake!'); // eslint-disable-line no-console
    const MAX_ATTEMPTS = 3;
    const attempts =
      (await browserStorage.get<number>('sw-reactivation-attempts')) ?? 0;
    if (attempts >= MAX_ATTEMPTS) {
      return;
    }
    await browserStorage.set('sw-reactivation-attempts', attempts + 1);
    this.onFailedHandshake();
  }

  private async handshake(port: browser.Runtime.Port) {
    /** Performs a two-way handshake to verify that background script is available */
    const number = getRandomInteger();
    Promise.race([
      sendPortMessage<{ syn: number }, { ack: number }>(port, { syn: number }),
      rejectAfterDelay(2000),
    ])
      .then((response) => {
        if (!response || response.ack !== number + 1) {
          throw new Error('Unexpected response');
        } else {
          return browserStorage.set('sw-reactivation-attempts', 0);
        }
      })
      .catch(() => this.handleHandshakeFail());
  }

  keepAlive() {
    const port = browser.runtime.connect({ name: 'handshake' });
    if (port.error) {
      return;
    }
    if (PERFORM_HANSHAKE_CHECK) {
      this.handshake(port);
    }
    port.onDisconnect.addListener(() => {
      // This means that the background-script (service-worker) went to sleep
      // We "wake" it up by creating a new runtime connection
      this.keepAlive();
    });
  }
}
