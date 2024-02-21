import browser from 'webextension-polyfill';
import type { RemoteConfig } from 'src/modules/remote-config';
import { getRemoteConfigValue } from 'src/modules/remote-config';
import { version } from 'src/shared/packageVersion';

export function setUninstallURL() {
  const uninstallLink = getRemoteConfigValue(
    'extension_uninstall_link'
  ) as RemoteConfig['extension_uninstall_link'];

  if (uninstallLink) {
    const uninstallURL = new URL(uninstallLink);
    uninstallURL.hash = uninstallURL.hash
      ? `${uninstallURL.hash}&app_version=${version}`
      : `#app_version=${version}`;
    browser.runtime.setUninstallURL(uninstallURL.toString());
  }
}
