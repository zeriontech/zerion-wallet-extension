import { splitDappPlaceholder } from './dappReferral';

describe('splitDappPlaceholder', () => {
  it('renders the placeholder as a named link', () => {
    expect(
      splitDappPlaceholder('Please use ${DAPP} to unshield.', {
        name: 'Zama',
        url: 'https://app.zama.org/',
      })
    ).toEqual([
      { kind: 'text', text: 'Please use ' },
      { kind: 'dapp', label: 'Zama', href: 'https://app.zama.org/' },
      { kind: 'text', text: ' to unshield.' },
    ]);
  });

  it('keeps plain text intact without a placeholder', () => {
    expect(
      splitDappPlaceholder('No route found.', {
        name: 'Zama',
        url: 'https://app.zama.org/',
      })
    ).toEqual([{ kind: 'text', text: 'No route found.' }]);
  });

  it('falls back to a plain name without a URL', () => {
    expect(
      splitDappPlaceholder('Use ${DAPP}.', { name: 'Zama', url: null })
    ).toEqual([
      { kind: 'text', text: 'Use ' },
      { kind: 'dapp', label: 'Zama', href: null },
      { kind: 'text', text: '.' },
    ]);
  });

  it('falls back to the host without a name', () => {
    expect(
      splitDappPlaceholder('Use ${DAPP}.', {
        name: null,
        url: 'https://app.zama.org/path',
      })
    ).toEqual([
      { kind: 'text', text: 'Use ' },
      {
        kind: 'dapp',
        label: 'app.zama.org',
        href: 'https://app.zama.org/path',
      },
      { kind: 'text', text: '.' },
    ]);
  });

  it('yields a null label when neither name nor URL is usable', () => {
    expect(splitDappPlaceholder('Use ${DAPP}.', undefined)).toEqual([
      { kind: 'text', text: 'Use ' },
      { kind: 'dapp', label: null, href: null },
      { kind: 'text', text: '.' },
    ]);
  });

  it('never links non-http URLs', () => {
    expect(
      splitDappPlaceholder('${DAPP}', {
        name: null,
        url: 'javascript:alert(1)',
      })
    ).toEqual([{ kind: 'dapp', label: null, href: null }]);
    expect(
      splitDappPlaceholder('${DAPP}', { name: 'Zama', url: 'not a url' })
    ).toEqual([{ kind: 'dapp', label: 'Zama', href: null }]);
  });

  it('handles multiple placeholders', () => {
    expect(
      splitDappPlaceholder('${DAPP} and ${DAPP}', { name: 'Zama', url: null })
    ).toEqual([
      { kind: 'dapp', label: 'Zama', href: null },
      { kind: 'text', text: ' and ' },
      { kind: 'dapp', label: 'Zama', href: null },
    ]);
  });
});
