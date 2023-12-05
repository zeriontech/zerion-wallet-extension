import browser from 'webextension-polyfill';
import { rejectAfterDelay } from '../rejectAfterDelay';

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

const PERFORM_HANSHAKE_CHECK = true;

export class BackgroundScriptUpdateHandler {
  /**
   * Problem: background script disconnects and reactivates on its own and we can't control that
   * When it disconnects, "port channels" (this is how UI talks to the background script)
   * need to be re-initialized in order to connect to the latest version of the background script
   * When we detect that the background script got reactivated, we re-initialize the whole UI
   */

  private onActivate: () => void;
  private onFailedHandshake?: () => void;
  private onDisconnect?: () => void;
  private portName: string;
  private performHandshake: boolean;
  private handshakeRetries = 2;

  constructor({
    onActivate,
    onDisconnect,
    onFailedHandshake,
    portName = 'handshake',
    performHandshake = true,
  }: {
    onActivate: () => void;
    onDisconnect?: () => void;
    onFailedHandshake?: () => void;
    portName?: string;
    performHandshake?: boolean;
  }) {
    this.onActivate = onActivate;
    this.onFailedHandshake = onFailedHandshake;
    this.onDisconnect = onDisconnect;
    this.portName = portName;
    this.performHandshake = performHandshake;
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
    this.onFailedHandshake?.();
  }

  private async handshake(port: browser.Runtime.Port) {
    /** Performs a two-way handshake to verify that background script is available */
    const number = getRandomInteger();
    return Promise.race([
      sendPortMessage<{ syn: number }, { ack: number }>(port, { syn: number }),
      rejectAfterDelay(1000, 'sendPortMessage'),
    ])
      .then((response) => {
        if (!response || response.ack !== number + 1) {
          throw new Error('Unexpected response');
        }
      })
      .catch((e) => {
        this.handshakeRetries -= 1;
        if (!this.handshakeRetries) {
          this.handleHandshakeFail();
        } else {
          throw e;
        }
      });
  }

  keepAlive() {
    const port = browser.runtime.connect({ name: this.portName });
    if (port.error) {
      return;
    }
    if (PERFORM_HANSHAKE_CHECK && this.performHandshake) {
      this.handshake(port).catch(() => {
        port.disconnect();
      });
    }
    port.onDisconnect.addListener(() => {
      this.onDisconnect?.();
      // This means that the background-script (service-worker) went to sleep
      // We "wake" it up by creating a new runtime connection
      this.keepAlive();
    });
  }
}
