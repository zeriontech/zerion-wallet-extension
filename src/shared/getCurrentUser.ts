import browser from 'webextension-polyfill';

export async function getCurrentUser() {
  return browser.storage.local.get('currentUser');
}
