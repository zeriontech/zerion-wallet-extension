import {
  createSendNativeOrContractTransaction,
  toEthersV5CompatibleHexValue,
} from './createSendTransaction';

const tests = [
  {
    // Optimism token on Optimism chain
    input: {
      tokenInterface: 'erc20',
      from: '0x42b9df65b219b3dd36ff330a4dd8f327a6ada990',
      to: '0x8c56a34129dcf0711fe57e47fdcb733fce40a29f',
      inputToken: '0x4200000000000000000000000000000000000042',
      value: '20000000000000000000',
      chainId: '0xa',
    },
    output: {
      from: '0x42b9df65b219b3dd36ff330a4dd8f327a6ada990',
      to: '0x4200000000000000000000000000000000000042',
      data: '0xa9059cbb0000000000000000000000008c56a34129dcf0711fe57e47fdcb733fce40a29f000000000000000000000000000000000000000000000001158e460913d00000',
      chainId: '0xa',
    },
  },
  {
    // BNB token on Binance chain
    input: {
      tokenInterface: 'native',
      from: '0x42b9df65b219b3dd36ff330a4dd8f327a6ada990',
      to: '0x8c56a34129dcf0711fe57e47fdcb733fce40a29f',
      inputToken: null,
      value: '10000000000000000',
      chainId: '0x38',
    },
    output: {
      from: '0x42b9df65b219b3dd36ff330a4dd8f327a6ada990',
      to: '0x8c56a34129dcf0711fe57e47fdcb733fce40a29f',
      value: '0x2386f26fc10000',
      chainId: '0x38',
      data: '0x',
    },
  },
  {
    // HOKK token on binance chain
    input: {
      tokenInterface: 'erc20',
      from: '0x8c56a34129dcf0711fe57e47fdcb733fce40a29f',
      to: '0x015fccd4ed178d3b3663157718c6ac8b3bfc1eb7',
      inputToken: '0xe87e15b9c7d989474cb6d8c56b3db4efad5b21e8',
      value: '13000000000000000000',
      chainId: '0x38',
    },
    output: {
      from: '0x8c56a34129dcf0711fe57e47fdcb733fce40a29f',
      to: '0xe87e15b9c7d989474cb6d8c56b3db4efad5b21e8',
      data: '0xa9059cbb000000000000000000000000015fccd4ed178d3b3663157718c6ac8b3bfc1eb7000000000000000000000000000000000000000000000000b469471f80140000',
      chainId: '0x38',
    },
  },
  {
    // ETH token on Ethereum chain
    input: {
      tokenInterface: 'native',
      from: '0x8c56a34129dcf0711fe57e47fdcb733fce40a29f',
      to: '0x015fccd4ed178d3b3663157718c6ac8b3bfc1eb7',
      inputToken: null,
      value: '1500000000000000000',
      chainId: '0x1',
    },
    output: {
      from: '0x8c56a34129dcf0711fe57e47fdcb733fce40a29f',
      to: '0x015fccd4ed178d3b3663157718c6ac8b3bfc1eb7',
      value: '0x14d1120d7b160000',
      chainId: '0x1',
      data: '0x',
    },
  },
  {
    // Uniswap token on Ethereum chain
    input: {
      tokenInterface: 'erc20',
      from: '0x8c56a34129dcf0711fe57e47fdcb733fce40a29f',
      to: '0x015fccd4ed178d3b3663157718c6ac8b3bfc1eb7',
      inputToken: '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984',
      value: '123000000000000000000',
      chainId: '0x1',
    },
    output: {
      from: '0x8c56a34129dcf0711fe57e47fdcb733fce40a29f',
      to: '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984',
      data: '0xa9059cbb000000000000000000000000015fccd4ed178d3b3663157718c6ac8b3bfc1eb7000000000000000000000000000000000000000000000006aaf7c8516d0c0000',
      chainId: '0x1',
    },
  },
  {
    input: {
      tokenInterface: 'native',
      from: '0x8c56a34129dcf0711fe57e47fdcb733fce40a29f',
      to: '0x42b9df65b219b3dd36ff330a4dd8f327a6ada990',
      inputToken: '0x7d1afa7b718fb893db30a3abc0cfc608aacfebb0',
      value: '1000000000000000000',
      chainId: '0x89',
    },
    output: {
      from: '0x8c56a34129dcf0711fe57e47fdcb733fce40a29f',
      to: '0x42b9df65b219b3dd36ff330a4dd8f327a6ada990',
      // value must NOT be zero padded,
      // i.e.  '0xde0b6b3a7640000' and NOT '0x0de0b6b3a7640000'
      value: '0xde0b6b3a7640000',
      chainId: '0x89',
      data: '0x',
    },
  },
] as const;

describe('createSendNativeOrContractTransaction', () => {
  test('creates valid native token send transactions', () => {
    const nativeCases = tests.filter(
      (x) => x.input.tokenInterface === 'native'
    );
    for (const testCase of nativeCases) {
      const result = createSendNativeOrContractTransaction(testCase.input);
      expect(result).toEqual(testCase.output);
    }
  });
  test('creates valid ERC-20 transfer transactions', () => {
    const erc20Cases = tests.filter((x) => x.input.tokenInterface === 'erc20');
    for (const testCase of erc20Cases) {
      const result = createSendNativeOrContractTransaction(testCase.input);
      expect(result).toEqual(testCase.output);
    }
  });
  test('requires a token address for erc-20', () => {
    expect(() =>
      createSendNativeOrContractTransaction({
        ...tests[0].input,
        inputToken: null,
      })
    ).toThrow();
  });
});

describe('toEthersV5CompatibleHexValue', () => {
  test('0x0', () => {
    expect(toEthersV5CompatibleHexValue('0x0')).toBe('0x0');
  });
  test('0x03', () => {
    expect(toEthersV5CompatibleHexValue('0x03')).toBe('0x3');
  });
  test('0x0de0b6b3a7640000', () => {
    expect(toEthersV5CompatibleHexValue('0x0de0b6b3a7640000')).toBe(
      '0xde0b6b3a7640000'
    );
    expect(toEthersV5CompatibleHexValue('0xde0b6b3a7640000')).toBe(
      '0xde0b6b3a7640000'
    );
  });
});
