import browser from 'webextension-polyfill';
import { dnaServicePort } from '../../shared/channels';
import { TRY_REGISTER_ACTION_EVENT } from './constants';

async function tryRegisterDnaAction() {
  // todo: simplify action registration without captcha
  if (await dnaServicePort.request('shouldRegisterAction')) {
    await dnaServicePort.request('tryRegisterAction');
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
