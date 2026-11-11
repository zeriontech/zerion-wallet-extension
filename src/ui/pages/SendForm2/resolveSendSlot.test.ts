import type { NetworkFeeType } from 'src/modules/zerion-api/types/NetworkFeeType';
import type { TransactionPrepareError } from 'src/modules/zerion-api/types/TransactionPrepareError';
import { resolveSendSlot } from './resolveSendSlot';

const networkFee: NetworkFeeType = {
  free: false,
  amount: { quantity: '0.0004', value: 1.2, usdValue: 1.2 },
  fungible: null,
};

const context = { assetSymbol: 'USDC', nativeAssetSymbol: 'ETH' };

const expectedTitles: Record<number, string> = {
  1: 'Insufficient USDC balance',
  2: 'Insufficient ETH for gas',
};

const codes = [null, 0, 1, 2, 3, 5, 7, 99];
const fees = [networkFee, null];
const hints = [null, 0, 1, 2, 7];

const cases = codes.flatMap((code) =>
  fees.flatMap((fee) => hints.map((hint) => [code, fee, hint] as const)),
);

describe('resolveSendSlot', () => {
  it('returns an empty slot for no response', () => {
    expect(resolveSendSlot(null, context)).toEqual({
      details: false,
      banner: null,
      button: null,
    });
  });

  it.each(cases)('code %p, fee %p, hint %p', (code, fee, hint) => {
    const message = `server message ${code}`;
    const error: TransactionPrepareError | null = code === null ? null : { code, message, hint };
    const slot = resolveSendSlot({ error, networkFee: fee }, context);

    expect(slot.details).toBe(fee !== null);
    if (code === null) {
      expect(slot.banner).toBeNull();
      expect(slot.button).toBeNull();
    } else {
      expect(slot.banner).toEqual({
        title: expectedTitles[code] ?? message,
        description: null,
      });
      expect(slot.button).toBe(hint === 1 ? 'top-up' : 'send-disabled');
    }
  });

  it('renders code 5 with its server message and a disabled Send', () => {
    const error: TransactionPrepareError = {
      code: 5,
      message: "This token can't be transferred",
      hint: 0,
    };
    expect(resolveSendSlot({ error, networkFee: null }, context)).toEqual({
      details: false,
      banner: { title: "This token can't be transferred", description: null },
      button: 'send-disabled',
    });
  });

  it('shows Details and the banner for code 2 with a fee', () => {
    const error: TransactionPrepareError = {
      code: 2,
      message: 'not enough base asset',
      hint: 1,
    };
    expect(resolveSendSlot({ error, networkFee }, context)).toEqual({
      details: true,
      banner: { title: 'Insufficient ETH for gas', description: null },
      button: 'top-up',
    });
  });

  describe('button depends only on hint', () => {
    const pairs = [1, 0, null, 2, 7].flatMap((hint) =>
      [1, 2, 5, 7, 99].map((code) => [hint, code] as const),
    );
    it.each(pairs)('hint %p, code %p', (hint, code) => {
      const error: TransactionPrepareError = { code, message: 'm', hint };
      for (const fee of fees) {
        expect(resolveSendSlot({ error, networkFee: fee }, context).button).toBe(
          hint === 1 ? 'top-up' : 'send-disabled',
        );
      }
    });
  });
});
