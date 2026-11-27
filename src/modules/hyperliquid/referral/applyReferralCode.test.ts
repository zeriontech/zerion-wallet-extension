import type { TypedData } from 'src/modules/ethereum/message-signing/TypedData';
import type { ExchangeRequestBody } from '../actions/types';
import type { ExchangeResponse } from '../api/submitExchangeAction.types';
import { applyHyperliquidReferralCode } from './applyReferralCode';

const SIGNATURE = '0x' + '11'.repeat(32) + '22'.repeat(32) + '1b';

describe('applyHyperliquidReferralCode', () => {
  test('signs an L1 setReferrer action with the runtime code and submits it', async () => {
    const signTypedData = vi.fn(async (_typedData: TypedData) => SIGNATURE);
    const submit = vi.fn(async (_body: ExchangeRequestBody): Promise<ExchangeResponse> => ({
      status: 'ok',
      response: { type: 'default' },
    }));

    await applyHyperliquidReferralCode({
      code: '  ZERIONAPP ',
      signTypedData,
      submit,
      now: () => 1_800_000_000_000,
    });

    expect(signTypedData).toHaveBeenCalledTimes(1);
    const typedData = signTypedData.mock.calls[0][0];
    expect(typedData.domain.name).toBe('Exchange');
    expect(typedData.primaryType).toBe('Agent');

    expect(submit).toHaveBeenCalledTimes(1);
    expect(submit.mock.calls[0][0]).toMatchObject({
      action: { type: 'setReferrer', code: 'ZERIONAPP' },
      nonce: 1_800_000_000_000,
      signature: { v: 27 },
    });
  });

  test('does not sign without a valid code', async () => {
    const signTypedData = vi.fn(async (_typedData: TypedData) => SIGNATURE);
    const submit = vi.fn(async (_body: ExchangeRequestBody): Promise<ExchangeResponse> => ({
      status: 'ok',
      response: { type: 'default' },
    }));
    await expect(
      applyHyperliquidReferralCode({ code: '   ', signTypedData, submit }),
    ).rejects.toThrow('valid Hyperliquid referral code');
    expect(signTypedData).not.toHaveBeenCalled();
    expect(submit).not.toHaveBeenCalled();
  });

  test('surfaces exchange errors', async () => {
    const signTypedData = vi.fn(async (_typedData: TypedData) => SIGNATURE);
    const submit = vi.fn(async (_body: ExchangeRequestBody): Promise<ExchangeResponse> => ({
      status: 'err',
      response: 'User has not deposited',
    }));
    await expect(
      applyHyperliquidReferralCode({ code: 'ZERIONAPP', signTypedData, submit }),
    ).rejects.toThrow('User has not deposited');
  });
});
