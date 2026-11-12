import { CLEARED_NETWORK_FEE_OVERRIDES, toConfiguration } from './networkFeeConfiguration';

const savedAverage = {
  speed: 'average' as const,
  custom1559GasPrice: null,
  customClassicGasPrice: null,
  gasLimit: null,
};

const savedCustom = {
  speed: 'custom' as const,
  custom1559GasPrice: { maxFee: 30_000_000_000, priorityFee: 1_500_000_000 },
  customClassicGasPrice: null,
  gasLimit: null,
};

describe('toConfiguration', () => {
  it('uses the saved level when the form has no explicit speed', () => {
    expect(toConfiguration({}, savedAverage).networkFee).toEqual(savedAverage);
    expect(toConfiguration({}, savedCustom).networkFee).toEqual(savedCustom);
  });

  it('lets an explicit form pick override the saved level', () => {
    const result = toConfiguration(
      {
        networkFeeSpeed: 'fast',
        maxFee: '',
        maxPriorityFee: '',
        gasPrice: '',
      },
      savedAverage,
    );
    expect(result.networkFee.speed).toBe('fast');
  });

  it('keeps fast as the fallback without a saved level', () => {
    expect(toConfiguration({}).networkFee.speed).toBe('fast');
  });
});

describe('CLEARED_NETWORK_FEE_OVERRIDES', () => {
  it('removes every override when spread over a state that has them', () => {
    const state = {
      inputChain: 'ethereum',
      networkFeeSpeed: 'custom',
      maxPriorityFee: '2',
      maxFee: '30',
      gasPrice: '25',
      gasLimit: '21000',
    };
    const cleared = { ...state, ...CLEARED_NETWORK_FEE_OVERRIDES };
    const remaining = Object.entries(cleared)
      .filter(([, value]) => value !== undefined)
      .map(([key]) => key);
    expect(remaining).toEqual(['inputChain']);
  });
});
