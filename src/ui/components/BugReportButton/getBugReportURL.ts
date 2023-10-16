import { detectBrowser } from 'src/modules/detect-browser';
import { version } from 'src/shared/packageVersion';

const { browser: browserName, version: browserVersion } = detectBrowser(
  navigator.userAgent
);

export function getBugButtonUrl(pathname: string, search: string) {
  return `https://zerion-io.typeform.com/bug-report#${new URLSearchParams({
    version,
    pathname,
    browser: `${browserName}/${browserVersion}`,
    platform: navigator.platform,
    search,
  })}`;
}
