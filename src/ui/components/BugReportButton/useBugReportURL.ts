import { useLocation } from 'react-router-dom';
import { version } from 'src/shared/packageVersion';
import { detectBrowser } from './detectBrowser';

const { browser: browserName, version: browserVersion } = detectBrowser(
  navigator.userAgent
);

export function useBugReportURL() {
  const { pathname, search } = useLocation();
  return `https://zerion-io.typeform.com/bug-report#${new URLSearchParams({
    version,
    pathname,
    browser: `${browserName}/${browserVersion}`,
    platform: navigator.platform,
    search,
  })}`;
}
