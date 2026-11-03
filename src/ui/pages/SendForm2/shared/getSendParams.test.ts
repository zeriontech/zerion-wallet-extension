import { makePosition } from 'src/ui/features/confidential-balances/confidentialUnderlying.fixtures';
import { getSendParams } from './getSendParams';

const CUSDC_ID = 'c8bb33a4-9f3c-48f6-bd76-97e3f4649670';
const USDC_ID = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48';
const BALANCE = '12.5';

const tokens = {
  wrapper: makePosition({
    fungibleId: CUSDC_ID,
    address: '0xe978f22157048e5db8e5d07971376e86671672b2',
    quantity: BALANCE,
  }),
  'non-wrapper': makePosition({
    fungibleId: USDC_ID,
    address: USDC_ID,
    quantity: BALANCE,
  }),
};

const amounts = { 'amount == balance': BALANCE, 'amount < balance': '3' };
const datas = {
  'custom data set': '0x68656c6c6f',
  'custom data unset': undefined,
};

const cases = Object.entries(tokens).flatMap(([token, position]) =>
  Object.entries(amounts).flatMap(([amountCase, amount]) =>
    Object.entries(datas).map(([dataCase, data]) => ({
      name: `${token}, ${amountCase}, ${dataCase}`,
      position,
      amount,
      data,
      expected:
        token === 'wrapper'
          ? { amount, max: undefined, data: undefined }
          : amount === BALANCE
          ? { amount: undefined, max: true, data }
          : { amount, max: undefined, data },
    }))
  )
);

describe('getSendParams', () => {
  test('covers all 8 combinations', () => {
    expect(cases).toHaveLength(8);
  });

  test.each(cases)('$name', ({ position, amount, data, expected }) => {
    expect(
      getSendParams({
        currency: 'usd',
        chain: 'ethereum',
        from: '0x42b9df65b219b3dd36ff330a4dd8f327a6ada990',
        to: '0xd8da6bf26964af9d7eed9e03e53415d37aa96045',
        assetId: position.fungible.id,
        amount,
        isNftMode: false,
        position,
        data,
      })
    ).toEqual({
      currency: 'usd',
      chain: 'ethereum',
      from: '0x42b9df65b219b3dd36ff330a4dd8f327a6ada990',
      to: '0xd8da6bf26964af9d7eed9e03e53415d37aa96045',
      assetId: position.fungible.id,
      ...expected,
    });
  });

  test('a typed zero on a zero-balance position is not a max send', () => {
    const position = makePosition({
      fungibleId: USDC_ID,
      address: USDC_ID,
      quantity: '0',
    });
    expect(
      getSendParams({
        currency: 'usd',
        chain: 'ethereum',
        from: '0x42b9df65b219b3dd36ff330a4dd8f327a6ada990',
        to: '0xd8da6bf26964af9d7eed9e03e53415d37aa96045',
        assetId: USDC_ID,
        amount: '0',
        isNftMode: false,
        position,
        data: undefined,
      })
    ).toMatchObject({ amount: '0', max: undefined });
  });
});
