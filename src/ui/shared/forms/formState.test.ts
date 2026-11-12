import { CLEARED_GAS_OVERRIDES, getMissingInputSelection } from './formState';

describe('getMissingInputSelection', () => {
  const resolved = { inputChain: 'ethereum', inputFungibleId: 'eth' };

  it('fills both keys when the URL has neither', () => {
    expect(getMissingInputSelection({}, resolved)).toEqual(resolved);
  });

  it('fills only the key the URL lacks', () => {
    expect(getMissingInputSelection({ inputChain: 'base' }, resolved)).toEqual({
      inputFungibleId: 'eth',
    });
    expect(getMissingInputSelection({ inputFungibleId: 'usdc' }, resolved)).toEqual({
      inputChain: 'ethereum',
    });
  });

  it('never overwrites what the URL already has', () => {
    expect(
      getMissingInputSelection({ inputChain: 'base', inputFungibleId: 'usdc' }, resolved),
    ).toBeNull();
  });

  it('has nothing to fill while the default is not resolved yet', () => {
    expect(getMissingInputSelection({}, {})).toBeNull();
    expect(getMissingInputSelection({}, { inputChain: 'ethereum' })).toEqual({
      inputChain: 'ethereum',
    });
  });
});

describe('CLEARED_GAS_OVERRIDES', () => {
  it('removes every override when spread over a state that has them', () => {
    const state = {
      inputChain: 'ethereum',
      networkFeeSpeed: 'custom',
      maxPriorityFee: '2',
      maxFee: '30',
      gasPrice: '25',
      gasLimit: '21000',
    };
    const cleared = { ...state, ...CLEARED_GAS_OVERRIDES };
    const remaining = Object.entries(cleared)
      .filter(([, value]) => value !== undefined)
      .map(([key]) => key);
    expect(remaining).toEqual(['inputChain']);
  });
});
