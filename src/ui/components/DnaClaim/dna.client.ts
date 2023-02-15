import browser from 'webextension-polyfill';
import { dnaServicePort } from '../../shared/channels';
import { TRY_REGISTER_ACTION_EVENT } from './constants';
import { resolveCaptcha } from './friendlyCaptcha';

async function tryRegisterDnaAction() {
  // I kept this check to avoid running a lot of captchas at the same time
  if (await dnaServicePort.request('shouldRegisterAction')) {
    const captcha = await resolveCaptcha();
    await dnaServicePort.request('tryRegisterAction', {
      captcha,
    });
  }
}

export function initDnaApi() {
  tryRegisterDnaAction();
  browser.runtime.onMessage.addListener((request) => {
    if (request.event === TRY_REGISTER_ACTION_EVENT) {
      tryRegisterDnaAction();
    }
  });
}
