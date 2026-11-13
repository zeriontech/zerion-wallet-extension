import { getInputDefaultsToPin } from './usePinDefaultInput';

describe('getInputDefaultsToPin', () => {
  const resolved = { inputChain: 'ethereum', inputFungibleId: 'eth' };

  it('fills both keys when the URL has neither', () => {
    expect(getInputDefaultsToPin({}, resolved)).toEqual(resolved);
  });

  it('fills only the key the URL lacks', () => {
    expect(getInputDefaultsToPin({ inputChain: 'base' }, resolved)).toEqual({
      inputFungibleId: 'eth',
    });
    expect(getInputDefaultsToPin({ inputFungibleId: 'usdc' }, resolved)).toEqual({
      inputChain: 'ethereum',
    });
  });

  it('never overwrites what the URL already has', () => {
    expect(
      getInputDefaultsToPin({ inputChain: 'base', inputFungibleId: 'usdc' }, resolved),
    ).toBeNull();
  });

  it('has nothing to fill while the default is not resolved yet', () => {
    expect(getInputDefaultsToPin({}, {})).toBeNull();
    expect(getInputDefaultsToPin({}, { inputChain: 'ethereum' })).toEqual({
      inputChain: 'ethereum',
    });
  });
});
