import { createTradeAddressAction2 } from 'src/modules/ethereum/transactions/addressAction/addressActionMain';
import type { NetworkInfo } from 'src/modules/networks/NetworkInfo';
import type { Fungible } from 'src/modules/zerion-api/types/Fungible';
import type { StringBase64 } from 'src/shared/types/StringBase64';
import { WEB_BACKEND_SUPPORTED } from 'src/ui/features/confidential-balances/confidentialUnderlying.fixtures';
import { getZamaSwapKind } from './zamaSwapKind';

const ethereum = {
  id: 'ethereum',
  name: 'Ethereum',
  iconUrl: null,
} as unknown as NetworkInfo;

const amount = { currency: 'usd', quantity: '1', value: null, usdValue: null };

type Side = { chain: string; fungibleId: string; address: string | null };

function buildAction(input: Side, output: Side) {
  const kind = getZamaSwapKind({
    inputChain: input.chain,
    inputFungibleId: input.fungibleId,
    inputAddress: input.address,
    outputChain: output.chain,
    outputFungibleId: output.fungibleId,
    outputAddress: output.address,
  });
  return {
    kind,
    action: createTradeAddressAction2({
      address: '0x42b9df65b219b3dd36ff330a4dd8f327a6ada990',
      transaction: { solana: 'AA==' as StringBase64 },
      hash: null,
      explorerUrl: null,
      spendAmount: amount,
      spendFungible: { id: input.fungibleId } as Fungible,
      receiveAmount: amount,
      receiveFungible: { id: output.fungibleId } as Fungible,
      network: ethereum,
      rate: null,
      type: kind ?? 'trade',
    }),
  };
}

describe.each(WEB_BACKEND_SUPPORTED)(
  'backend-supported pair %s ↔ %s',
  (wrapperAddress, underlyingId) => {
    const wrapper: Side = {
      chain: 'ethereum',
      fungibleId: `wrapper-${wrapperAddress}`,
      address: wrapperAddress,
    };
    const underlying: Side = {
      chain: 'ethereum',
      fungibleId: underlyingId,
      address: underlyingId.startsWith('0x') ? underlyingId : null,
    };

    test('wrapper → underlying is a Withdraw', () => {
      const { kind, action } = buildAction(wrapper, underlying);
      expect(kind).toBe('withdraw');
      expect(action.type).toEqual({
        value: 'withdraw',
        displayValue: 'Withdraw',
      });
      expect(action.acts?.[0].type).toEqual(action.type);
    });

    test('underlying → wrapper is a Deposit', () => {
      const { kind, action } = buildAction(underlying, wrapper);
      expect(kind).toBe('deposit');
      expect(action.type).toEqual({
        value: 'deposit',
        displayValue: 'Deposit',
      });
      expect(action.acts?.[0].type).toEqual(action.type);
    });
  }
);

describe('pairs that are not a shield or unshield stay Trade', () => {
  const [[cusdcAddress, usdcId], [, usdtId]] = WEB_BACKEND_SUPPORTED;
  const cUSDC: Side = {
    chain: 'ethereum',
    fungibleId: 'cusdc',
    address: cusdcAddress,
  };

  test('a wrapper paired with a different underlying', () => {
    const usdt: Side = {
      chain: 'ethereum',
      fungibleId: usdtId,
      address: usdtId,
    };
    for (const [input, output] of [
      [cUSDC, usdt],
      [usdt, cUSDC],
    ]) {
      const { kind, action } = buildAction(input, output);
      expect(kind).toBe(null);
      expect(action.type.value).toBe('trade');
      expect(action.type.displayValue).toBe('Trade');
    }
  });

  test('the same pair across two chains', () => {
    const usdcOnBase: Side = {
      chain: 'base',
      fungibleId: usdcId,
      address: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913',
    };
    for (const [input, output] of [
      [cUSDC, usdcOnBase],
      [usdcOnBase, cUSDC],
    ]) {
      const { kind, action } = buildAction(input, output);
      expect(kind).toBe(null);
      expect(action.type.value).toBe('trade');
    }
  });

  test('the builder defaults to Trade without a type', () => {
    const action = createTradeAddressAction2({
      address: '0x42b9df65b219b3dd36ff330a4dd8f327a6ada990',
      transaction: { solana: 'AA==' as StringBase64 },
      hash: null,
      explorerUrl: null,
      spendAmount: amount,
      spendFungible: { id: 'eth' } as Fungible,
      receiveAmount: amount,
      receiveFungible: { id: usdcId } as Fungible,
      network: ethereum,
      rate: null,
    });
    expect(action.type).toEqual({ value: 'trade', displayValue: 'Trade' });
  });
});
