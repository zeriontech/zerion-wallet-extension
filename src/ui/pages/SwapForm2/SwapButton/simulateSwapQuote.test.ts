import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import type { Quote2 } from 'src/shared/types/Quote';
import type { MultichainTransaction } from 'src/shared/types/MultichainTransaction';
import type { SignatureInterpretResponse } from 'src/modules/zerion-api/requests/wallet-simulate-signature';
import type {
  InterpretResponse,
  Warning,
} from 'src/modules/zerion-api/requests/wallet-simulate-transaction';
import { ZEROX_GASLESS_TRADE } from 'src/ui/shared/forms/trading/intentTypedData.fixtures';
import type { SwapFormState2 } from '../types';

const walletSimulateSignature =
  jest.fn<
    (params: unknown, options: unknown) => Promise<SignatureInterpretResponse>
  >();
const interpretTxBasedOnEligibility =
  jest.fn<(params: unknown) => Promise<InterpretResponse | null>>();

jest.unstable_mockModule('src/modules/zerion-api/zerion-api.client', () => ({
  ZerionAPI: { walletSimulateSignature },
}));
jest.unstable_mockModule(
  'src/ui/shared/requests/uiInterpretTransaction',
  () => ({ interpretTxBasedOnEligibility })
);

const { simulateSwapQuote } = await import('./simulateSwapQuote');
const { resolveTransactionWarning } = await import(
  '../TransactionWarning/resolveTransactionWarning'
);

const ADDRESS = '0xa9d1e08c7793af67e9d92fe308d5697fb81d3e43';
const APPROVE_TX = { evm: { to: '0x1' } } as unknown as MultichainTransaction;

const warning = (title: string): Warning =>
  ({ severity: 'Orange', title, description: title, details: '' } as Warning);

function makeQuote(intentSwap: Quote2['intentSwap']): Quote2 {
  return {
    quoteId: 'q-1',
    intentSwap,
    transactionSwap: null,
    outputAmount: { currency: 'usd', quantity: '100', value: 1, usdValue: 1 },
    contractMetadata: { id: 'zerox', name: '0x', iconUrl: '', explorer: null },
    finalSlippage: null,
    error: null,
  } as unknown as Quote2;
}

const simulate = (quote: Quote2, transactions: MultichainTransaction[]) =>
  simulateSwapQuote({
    address: ADDRESS,
    chain: 'base',
    quote,
    transactions,
    currency: 'usd',
    origin: 'https://app.zerion.io',
    source: 'mainnet',
  });

describe('simulateSwapQuote', () => {
  beforeEach(() => {
    walletSimulateSignature.mockReset();
    interpretTxBasedOnEligibility.mockReset();
  });

  it('simulates an EVM intent on the prepared typed data and merges the approve warnings', async () => {
    interpretTxBasedOnEligibility.mockResolvedValue({
      data: { action: null, warnings: [warning('Approve warning')] },
    } as unknown as InterpretResponse);
    walletSimulateSignature.mockResolvedValue({
      data: { action: null, warnings: [warning('Intent warning')] },
    });

    const result = await simulate(
      makeQuote({ evm: ZEROX_GASLESS_TRADE, solana: null }),
      [APPROVE_TX]
    );

    expect(walletSimulateSignature).toHaveBeenCalledTimes(1);
    const [params, options] = walletSimulateSignature.mock.calls[0] as [
      {
        address: string;
        chain: string;
        signature: {
          typedData: {
            domain: Record<string, unknown>;
            types: Record<string, unknown>;
          };
        };
      },
      unknown
    ];
    expect(params.address).toBe(ADDRESS);
    expect(params.chain).toBe('base');
    expect(params.signature.typedData.domain).toEqual({
      name: 'Permit2',
      chainId: 8453,
      verifyingContract: '0x000000000022d473030f116ddee9f6b43ac78ba3',
    });
    expect(params.signature.typedData.types.EIP712Domain).toBeDefined();
    expect(options).toEqual({ source: 'mainnet' });
    expect(interpretTxBasedOnEligibility).toHaveBeenCalledWith(
      expect.objectContaining({ transactions: [APPROVE_TX] })
    );
    expect(
      result && 'data' in result
        ? result.data.warnings.map((w) => w.title)
        : null
    ).toEqual(['Approve warning', 'Intent warning']);

    const resolved = resolveTransactionWarning({
      quote: makeQuote({ evm: ZEROX_GASLESS_TRADE, solana: null }),
      quotesQuery: {
        done: true,
        isLoading: false,
        quotes: [],
        error: null,
      } as never,
      formState: {
        inputChain: 'base',
        outputChain: 'base',
        inputFungibleId: 'usdc',
        outputFungibleId: 'eth',
        inputAmount: '1',
      } as SwapFormState2,
      simulationResult: result,
      inputNetwork: null,
      outputNetwork: null,
    });
    expect(resolved.warning?.title).toBe('Approve warning');
  });

  it('simulates a permit-only EVM intent without simulate-transactions', async () => {
    walletSimulateSignature.mockResolvedValue({
      data: { action: null, warnings: [] },
    });
    const result = await simulate(
      makeQuote({ evm: ZEROX_GASLESS_TRADE, solana: null }),
      []
    );
    expect(interpretTxBasedOnEligibility).not.toHaveBeenCalled();
    expect(walletSimulateSignature).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ data: { action: null, warnings: [] } });
  });

  it('does not simulate a Solana intent', async () => {
    const result = await simulate(makeQuote({ evm: null, solana: 'AQID' }), []);
    expect(walletSimulateSignature).not.toHaveBeenCalled();
    expect(interpretTxBasedOnEligibility).not.toHaveBeenCalled();
    expect(result).toBeNull();
  });

  it('keeps a classic quote on simulate-transactions only', async () => {
    const txResult = {
      data: { action: null, warnings: [] },
    } as unknown as InterpretResponse;
    interpretTxBasedOnEligibility.mockResolvedValue(txResult);
    const classic = { ...makeQuote(null), quoteId: '' } as Quote2;
    const result = await simulate(classic, [APPROVE_TX]);
    expect(walletSimulateSignature).not.toHaveBeenCalled();
    expect(result).toBe(txResult);
  });
});
