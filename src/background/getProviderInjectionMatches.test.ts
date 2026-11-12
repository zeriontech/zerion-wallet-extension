import { getProviderInjectionMatches } from './getProviderInjectionMatches';

describe('getProviderInjectionMatches', () => {
  const NOW = 1_000_000;

  it('matches every url when there is no all-sites pause', () => {
    expect(getProviderInjectionMatches(undefined, NOW)).toEqual(['<all_urls>']);
  });

  it('matches nothing while an indefinite pause is set', () => {
    expect(getProviderInjectionMatches({ expires: null }, NOW)).toBeUndefined();
  });

  it('matches nothing while a timed pause has not expired', () => {
    expect(getProviderInjectionMatches({ expires: NOW + 1 }, NOW)).toBeUndefined();
  });

  it('matches every url again once a timed pause has expired', () => {
    expect(getProviderInjectionMatches({ expires: NOW - 1 }, NOW)).toEqual(['<all_urls>']);
  });

  it('treats a pause expiring exactly now as expired', () => {
    expect(getProviderInjectionMatches({ expires: NOW }, NOW)).toEqual(['<all_urls>']);
  });
});
