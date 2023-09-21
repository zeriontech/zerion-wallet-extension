import { detectBrowser } from './detect-browser';

describe('detectBrowser', () => {
  const userAgents = {
    firefox:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:107.0) Gecko/20100101 Firefox/107.0',
    chrome:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36',
    safari:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Mobile/15E148 Safari/604.1',
  };

  test('detects chrome', () => {
    expect(detectBrowser(userAgents.chrome)).toEqual({
      browser: 'Chrome',
      version: '108.0.0.0',
    });
  });

  test('detects firefox', () => {
    expect(detectBrowser(userAgents.firefox)).toEqual({
      browser: 'Firefox',
      version: '107.0',
    });
  });

  test('detects safari', () => {
    expect(detectBrowser(userAgents.safari)).toEqual({
      browser: 'Safari',
      version: '604.1',
    });
  });
});
