import browser from 'webextension-polyfill';
import { dnaServicePort } from '../../shared/channels';
import { TRY_REGISTER_ACTION_EVENT } from './constants';
import { resolveCaptcha } from './friendlyCaptcha';

const DISABLE_CAPTCHA_SOLVING = true; // Temporarily disable the event until the captcha issue is resolved

async function tryRegisterDnaAction() {
  // I kept this check to avoid running a lot of captchas at the same time
  if (await dnaServicePort.request('shouldRegisterAction')) {
    const captcha = DISABLE_CAPTCHA_SOLVING ? '' : await resolveCaptcha();
    await dnaServicePort.request('tryRegisterAction', {
      captcha,
    });
  }
}

let actionRegisterInProgress = false;

export function initDnaApi() {
  tryRegisterDnaAction();
  browser.runtime.onMessage.addListener(async (request) => {
    if (
      request.event === TRY_REGISTER_ACTION_EVENT &&
      !actionRegisterInProgress
    ) {
      actionRegisterInProgress = true;
      await tryRegisterDnaAction();
      actionRegisterInProgress = false;
    }
  });
}
