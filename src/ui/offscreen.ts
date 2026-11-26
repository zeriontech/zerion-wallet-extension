import browser from 'webextension-polyfill';
import {
  CLOUDFLARE_CHALLENGE_MESSAGE,
  type CloudflareChallengeMessage,
} from 'src/shared/cloudflareChallenge';
import { isObj } from 'src/shared/isObj';

const TURNSTILE_ORIGIN = 'https://app.zerion.io';
const TURNSTILE_PATH = '/turnstile.html';

function send(message: CloudflareChallengeMessage) {
  void browser.runtime.sendMessage(message).catch(() => {});
}

const iframe = document.createElement('iframe');
iframe.src = new URL(TURNSTILE_PATH, TURNSTILE_ORIGIN).toString();
iframe.setAttribute('sandbox', 'allow-same-origin allow-scripts');
iframe.setAttribute('title', 'Cloudflare security check');
iframe.style.cssText = 'width:300px;height:88px;border:0;position:fixed;left:0;top:0;';

iframe.addEventListener('error', () => {
  send({ type: CLOUDFLARE_CHALLENGE_MESSAGE, action: 'offscreen-failed' });
});

window.addEventListener('message', (event) => {
  if (event.origin !== TURNSTILE_ORIGIN) return;
  if (event.source !== iframe.contentWindow) return;
  if (!isObj(event.data) || event.data.method !== 'set-turnstile-token') return;
  send({
    type: CLOUDFLARE_CHALLENGE_MESSAGE,
    action: 'solved',
    surface: 'offscreen',
  });
});

document.body.appendChild(iframe);
