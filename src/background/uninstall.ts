import browser from 'webextension-polyfill';
import type { RemoteConfig } from 'src/modules/remote-config';
import { getRemoteConfigValue } from 'src/modules/remote-config';

export function setUninstallURL() {
  const uninstallURL = getRemoteConfigValue(
    'extension_uninstall_link'
  ) as RemoteConfig['extension_uninstall_link'];

  if (uninstallURL) {
    browser.runtime.setUninstallURL(uninstallURL);
  }
}
