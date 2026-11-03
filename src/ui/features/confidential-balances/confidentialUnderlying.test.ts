import {
  findConfidentialUnderlyingFungibleId,
  getConfidentialUnderlyingFungibleId,
} from './confidentialUnderlying';
import {
  makePosition,
  WEB_BACKEND_SUPPORTED,
  WEB_REGISTRY_ONLY,
} from './confidentialUnderlying.fixtures';

describe('getConfidentialUnderlyingFungibleId', () => {
  test('the expected table holds 9 backend-supported and 17 registry-only pairs', () => {
    expect(WEB_BACKEND_SUPPORTED).toHaveLength(9);
    expect(WEB_REGISTRY_ONLY).toHaveLength(17);
    expect(
      new Set([...WEB_BACKEND_SUPPORTED, ...WEB_REGISTRY_ONLY].map(([a]) => a))
        .size
    ).toBe(26);
  });

  test.each([...WEB_BACKEND_SUPPORTED, ...WEB_REGISTRY_ONLY])(
    'Ethereum wrapper %s maps to %s, case-insensitively',
    (wrapper, underlying) => {
      expect(getConfidentialUnderlyingFungibleId('ethereum', wrapper)).toBe(
        underlying
      );
      expect(
        getConfidentialUnderlyingFungibleId('ethereum', wrapper.toUpperCase())
      ).toBe(underlying);
    }
  );

  test.each([...WEB_BACKEND_SUPPORTED, ...WEB_REGISTRY_ONLY])(
    'wrapper %s on another chain maps to nothing',
    (wrapper) => {
      expect(getConfidentialUnderlyingFungibleId('base', wrapper)).toBe(
        undefined
      );
    }
  );

  test('a non-wrapper address maps to nothing', () => {
    expect(
      getConfidentialUnderlyingFungibleId(
        'ethereum',
        '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'
      )
    ).toBe(undefined);
  });

  test('a missing address maps to nothing', () => {
    expect(getConfidentialUnderlyingFungibleId('ethereum', null)).toBe(
      undefined
    );
    expect(getConfidentialUnderlyingFungibleId('ethereum', undefined)).toBe(
      undefined
    );
  });
});

describe('findConfidentialUnderlyingFungibleId', () => {
  const CUSDC_ID = 'c8bb33a4-9f3c-48f6-bd76-97e3f4649670';
  const cUSDC = makePosition({
    fungibleId: CUSDC_ID,
    address: '0xE978F22157048E5DB8E5D07971376E86671672B2',
  });
  const NO_ETHEREUM_IMPL_ID = 'no-ethereum-implementation';
  const noEthereumImplementation = makePosition({
    chainId: 'base',
    fungibleId: NO_ETHEREUM_IMPL_ID,
    address: '0xe978f22157048e5db8e5d07971376e86671672b2',
  });
  const positions = [cUSDC, noEthereumImplementation];

  test('reads the wrapper address from the held position', () => {
    expect(
      findConfidentialUnderlyingFungibleId(positions, 'ethereum', CUSDC_ID)
    ).toBe('0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48');
  });

  test('a position without an Ethereum implementation maps to nothing', () => {
    expect(
      findConfidentialUnderlyingFungibleId(
        positions,
        'ethereum',
        NO_ETHEREUM_IMPL_ID
      )
    ).toBe(undefined);
  });

  test('a fungible the wallet does not hold maps to nothing', () => {
    expect(
      findConfidentialUnderlyingFungibleId(positions, 'ethereum', 'unheld')
    ).toBe(undefined);
  });
});
