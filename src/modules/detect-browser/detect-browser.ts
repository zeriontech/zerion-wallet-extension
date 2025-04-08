export function detectBrowser(string: string) {
  /**
   * We parse as simple as possible without considering edge cases
   * or unusual browsers; extension can only be run in Chrome anyway right now
   */
  const patterns = {
    firefox: /(Firefox)\/((?:\w|\.)+)/,
    chrome: /(Chrome)\/((?:\w|\.)+)/,
    safari: /(Safari)\/((?:\w|\.)+)/,
  };
  const match =
    string.match(patterns.firefox) ||
    string.match(patterns.chrome) ||
    string.match(patterns.safari);

  if (match) {
    return { browser: match[1], version: match[2] };
  } else {
    return { browser: 'unknown', version: 'unknown' };
  }
}
