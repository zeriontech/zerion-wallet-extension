import type { Quote2 } from 'src/shared/types/Quote';
import type { QuotesData } from 'src/ui/shared/requests/useQuotes';
import type { NetworkConfig } from 'src/modules/networks/NetworkConfig';
import type {
  InterpretResponse,
  Warning as SimulationWarning,
} from 'src/modules/zerion-api/requests/wallet-simulate-transaction';
import type { SwapFormState2 } from '../types';
import {
  resolveTransactionWarning,
  type SimulationResult,
} from './resolveTransactionWarning';

// ---- Test fixtures (only the fields the resolver reads) ----

const baseFormState: SwapFormState2 = {
  inputChain: 'ethereum',
  inputFungibleId: 'eth',
  outputChain: 'ethereum',
  outputFungibleId: 'usdc',
  inputAmount: '1',
};

function makeQuote(
  outputQuantity: string,
  options?: { finalSlippage?: number | null }
): Quote2 {
  return {
    outputAmount: {
      currency: 'usd',
      quantity: outputQuantity,
      value: null,
      usdValue: null,
    },
    contractMetadata: {
      id: 'test-provider',
      name: 'Test',
      iconUrl: '',
      explorer: null,
    },
    finalSlippage: options?.finalSlippage ?? null,
  } as unknown as Quote2;
}

function makeQuotesQuery(quotes: Quote2[]): QuotesData<Quote2> {
  return {
    done: true,
    isLoading: false,
    quotes,
    error: null,
  } as unknown as QuotesData<Quote2>;
}

// Default fixture: a populated quotes query so the "No providers available"
// form-state warning doesn't fire by default.
const idleQuotesQuery: QuotesData<Quote2> = makeQuotesQuery([makeQuote('100')]);

const ethereum: NetworkConfig = {
  id: 'ethereum',
  name: 'Ethereum',
  supports_trading: true,
  supports_bridging: true,
  supports_simulations: true,
} as unknown as NetworkConfig;

function makeSimulation({
  warnings = [],
  status,
  outgoingFungibleId,
  incoming,
}: {
  warnings?: SimulationWarning[];
  status?: 'confirmed' | 'failed' | 'pending' | 'dropped';
  outgoingFungibleId?: string;
  incoming?: Array<{ fungibleId: string; quantity: string }>;
} = {}): SimulationResult {
  return {
    data: {
      action:
        status == null && incoming == null
          ? null
          : ({
              status: status ?? 'confirmed',
              content: {
                transfers: [
                  ...(outgoingFungibleId
                    ? [
                        {
                          direction: 'out',
                          amount: { quantity: '1' },
                          fungible: { id: outgoingFungibleId },
                        },
                      ]
                    : []),
                  ...(incoming ?? []).map((t) => ({
                    direction: 'in',
                    amount: { quantity: t.quantity },
                    fungible: { id: t.fungibleId },
                  })),
                ],
              },
            } as unknown as InterpretResponse['data']['action']),
      warnings,
    },
  } as unknown as InterpretResponse;
}

const baseInputs = {
  quote: makeQuote('100'),
  quotesQuery: idleQuotesQuery,
  formState: baseFormState,
  inputNetwork: ethereum,
  outputNetwork: ethereum,
};

// ---- Tests ----

describe('resolveTransactionWarning', () => {
  describe('no simulation yet', () => {
    it('returns no warning when nothing is wrong', () => {
      const r = resolveTransactionWarning({
        ...baseInputs,
        simulationResult: null,
      });
      expect(r.warning).toBeNull();
      expect(r.unverified).toBe(false);
      expect(r.blocksAutoSign).toBe(false);
      expect(r.dangerTitle).toBeNull();
    });
  });

  describe('priority: API severity wins over status=failed and over output mismatch', () => {
    it('Yellow severity beats status=failed', () => {
      const sim = makeSimulation({
        warnings: [
          {
            severity: 'Yellow',
            title: 'Risky approval',
            description: 'Be careful',
            details: '',
          },
        ],
        status: 'failed',
        incoming: [{ fungibleId: 'usdc', quantity: '50' }], // also a mismatch
      });
      const r = resolveTransactionWarning({
        ...baseInputs,
        simulationResult: sim,
      });
      expect(r.warning).toEqual({
        variant: 'warning',
        title: 'Risky approval',
        description: 'Be careful',
      });
      expect(r.blocksAutoSign).toBe(true);
      expect(r.dangerTitle).toBe('Proceed Anyway');
    });

    it('Red severity wins over Yellow within warnings[]', () => {
      const sim = makeSimulation({
        warnings: [
          { severity: 'Yellow', title: 'Mild', description: '', details: '' },
          { severity: 'Red', title: 'Critical', description: 'd', details: '' },
        ],
      });
      const r = resolveTransactionWarning({
        ...baseInputs,
        simulationResult: sim,
      });
      expect(r.warning?.title).toBe('Critical');
      expect(r.warning?.variant).toBe('error');
    });

    it('Orange maps to error variant (treated as Red)', () => {
      const sim = makeSimulation({
        warnings: [
          {
            severity: 'Orange',
            title: 'Heads up',
            description: '',
            details: '',
          },
        ],
      });
      const r = resolveTransactionWarning({
        ...baseInputs,
        simulationResult: sim,
      });
      expect(r.warning?.variant).toBe('error');
    });

    it('first-in-array tiebreak between equal severities', () => {
      const sim = makeSimulation({
        warnings: [
          { severity: 'Red', title: 'First', description: '', details: '' },
          { severity: 'Red', title: 'Second', description: '', details: '' },
        ],
      });
      const r = resolveTransactionWarning({
        ...baseInputs,
        simulationResult: sim,
      });
      expect(r.warning?.title).toBe('First');
    });
  });

  describe('status === failed', () => {
    it('shows the failed copy when no severity warnings present', () => {
      const sim = makeSimulation({
        status: 'failed',
        incoming: [{ fungibleId: 'usdc', quantity: '100' }],
      });
      const r = resolveTransactionWarning({
        ...baseInputs,
        simulationResult: sim,
      });
      expect(r.warning?.title).toBe('Transaction will fail');
      expect(r.warning?.variant).toBe('error');
      expect(r.blocksAutoSign).toBe(true);
      expect(r.dangerTitle).toBe('Proceed Anyway');
    });

    it('outranks output mismatch', () => {
      const sim = makeSimulation({
        status: 'failed',
        incoming: [{ fungibleId: 'usdc', quantity: '50' }],
      });
      const r = resolveTransactionWarning({
        ...baseInputs,
        simulationResult: sim,
      });
      expect(r.warning?.title).toBe('Transaction will fail');
    });
  });

  describe('output mismatch', () => {
    it('exact quote match → no warning', () => {
      const sim = makeSimulation({
        incoming: [{ fungibleId: 'usdc', quantity: '100' }],
      });
      const r = resolveTransactionWarning({
        ...baseInputs,
        simulationResult: sim,
      });
      expect(r.warning).toBeNull();
      expect(r.blocksAutoSign).toBe(false);
    });

    it('within epsilon (1%) → no warning', () => {
      // 100 vs 100.5 → diff ratio 0.005 (< 0.01)
      const sim = makeSimulation({
        incoming: [{ fungibleId: 'usdc', quantity: '100.5' }],
      });
      const r = resolveTransactionWarning({
        ...baseInputs,
        simulationResult: sim,
      });
      expect(r.warning).toBeNull();
    });

    it('at exact epsilon boundary (1%) → no warning', () => {
      // 100 vs 99 → diff ratio 0.01; gt(epsilon) is false, no warning fires.
      const sim = makeSimulation({
        incoming: [{ fungibleId: 'usdc', quantity: '99' }],
      });
      const r = resolveTransactionWarning({
        ...baseInputs,
        simulationResult: sim,
      });
      expect(r.warning).toBeNull();
    });

    it('below quote by more than epsilon → warns', () => {
      // 100 vs 98 → diff ratio 0.02 (> 0.01)
      const sim = makeSimulation({
        incoming: [{ fungibleId: 'usdc', quantity: '98' }],
      });
      const r = resolveTransactionWarning({
        ...baseInputs,
        simulationResult: sim,
      });
      expect(r.warning?.title).toBe('Output amount mismatch');
      expect(r.warning?.variant).toBe('error');
      expect(r.dangerTitle).toBe('Proceed Anyway');
    });

    it('above quote by more than epsilon also warns (symmetric)', () => {
      // 100 vs 102 → diff ratio 0.02 (> 0.01)
      const sim = makeSimulation({
        incoming: [{ fungibleId: 'usdc', quantity: '102' }],
      });
      const r = resolveTransactionWarning({
        ...baseInputs,
        simulationResult: sim,
      });
      expect(r.warning?.title).toBe('Output amount mismatch');
    });

    it('quote.outputAmount of 0 → no mismatch warning (avoids divide-by-zero)', () => {
      const r = resolveTransactionWarning({
        ...baseInputs,
        quote: makeQuote('0'),
        simulationResult: makeSimulation({
          incoming: [{ fungibleId: 'usdc', quantity: '0' }],
        }),
      });
      expect(r.warning).toBeNull();
    });

    it('diff within finalSlippage → no warning (slippage raises threshold)', () => {
      // 100 vs 97 → diff 0.03; finalSlippage 5% → threshold 0.05; 0.03 < 0.05.
      const r = resolveTransactionWarning({
        ...baseInputs,
        quote: makeQuote('100', { finalSlippage: 5 }),
        simulationResult: makeSimulation({
          incoming: [{ fungibleId: 'usdc', quantity: '97' }],
        }),
      });
      expect(r.warning).toBeNull();
    });

    it('diff exceeds finalSlippage → warns', () => {
      // 100 vs 90 → diff 0.10; finalSlippage 5% → threshold 0.05; 0.10 > 0.05.
      const r = resolveTransactionWarning({
        ...baseInputs,
        quote: makeQuote('100', { finalSlippage: 5 }),
        simulationResult: makeSimulation({
          incoming: [{ fungibleId: 'usdc', quantity: '90' }],
        }),
      });
      expect(r.warning?.title).toBe('Output amount mismatch');
    });

    it('finalSlippage below epsilon → epsilon floor still applies', () => {
      // 100 vs 99.2 → diff 0.008; finalSlippage 0.1% → threshold stays at 0.01.
      // 0.008 < 0.01, no warning.
      const r = resolveTransactionWarning({
        ...baseInputs,
        quote: makeQuote('100', { finalSlippage: 0.1 }),
        simulationResult: makeSimulation({
          incoming: [{ fungibleId: 'usdc', quantity: '99.2' }],
        }),
      });
      expect(r.warning).toBeNull();
    });

    it('finalSlippage null → falls back to epsilon (existing behavior)', () => {
      // 100 vs 98 → diff 0.02 > epsilon 0.01.
      const r = resolveTransactionWarning({
        ...baseInputs,
        quote: makeQuote('100', { finalSlippage: null }),
        simulationResult: makeSimulation({
          incoming: [{ fungibleId: 'usdc', quantity: '98' }],
        }),
      });
      expect(r.warning?.title).toBe('Output amount mismatch');
    });
  });

  describe('unverified detection (UnverifiedWarning trigger)', () => {
    it('Gray severity → unverified, no danger, blocks auto-sign', () => {
      const sim = makeSimulation({
        warnings: [
          {
            severity: 'Gray',
            title: 'Unverified',
            description: '',
            details: '',
          },
        ],
        incoming: [{ fungibleId: 'usdc', quantity: '100' }],
      });
      const r = resolveTransactionWarning({
        ...baseInputs,
        simulationResult: sim,
      });
      expect(r.unverified).toBe(true);
      expect(r.dangerTitle).toBeNull();
      expect(r.blocksAutoSign).toBe(true);
      expect(r.warning).toBeNull(); // no TransactionWarning content
    });

    it('action is null → unverified', () => {
      const sim: SimulationResult = {
        data: { action: null, warnings: [] },
      } as unknown as InterpretResponse;
      const r = resolveTransactionWarning({
        ...baseInputs,
        simulationResult: sim,
      });
      expect(r.unverified).toBe(true);
      expect(r.blocksAutoSign).toBe(true);
    });

    it('no incoming transfer matches outputFungibleId → unverified', () => {
      const sim = makeSimulation({
        incoming: [{ fungibleId: 'dai', quantity: '100' }],
      });
      const r = resolveTransactionWarning({
        ...baseInputs,
        simulationResult: sim,
      });
      expect(r.unverified).toBe(true);
      expect(r.warning).toBeNull(); // mismatch check skipped, no TransactionWarning
    });

    it('cross-chain with no incoming transfer for outputFungibleId → NOT unverified', () => {
      // Output lands on the destination chain, so the source-chain simulation
      // legitimately has no matching incoming transfer. We must not flag this
      // as unverified or block auto-sign.
      const sim = makeSimulation({
        status: 'confirmed',
        outgoingFungibleId: 'eth',
      });
      const r = resolveTransactionWarning({
        ...baseInputs,
        formState: { ...baseFormState, outputChain: 'arbitrum' },
        simulationResult: sim,
      });
      expect(r.unverified).toBe(false);
      expect(r.warning).toBeNull();
      expect(r.blocksAutoSign).toBe(false);
      expect(r.dangerTitle).toBeNull();
    });

    it('cross-chain still unverified when simulation has no inspectable action', () => {
      const sim: SimulationResult = {
        data: { action: null, warnings: [] },
      } as unknown as InterpretResponse;
      const r = resolveTransactionWarning({
        ...baseInputs,
        formState: { ...baseFormState, outputChain: 'arbitrum' },
        simulationResult: sim,
      });
      expect(r.unverified).toBe(true);
      expect(r.blocksAutoSign).toBe(true);
    });

    it('cross-chain still unverified when multiple incoming transfers match', () => {
      const sim = makeSimulation({
        incoming: [
          { fungibleId: 'usdc', quantity: '50' },
          { fungibleId: 'usdc', quantity: '60' },
        ],
      });
      const r = resolveTransactionWarning({
        ...baseInputs,
        formState: { ...baseFormState, outputChain: 'arbitrum' },
        simulationResult: sim,
      });
      expect(r.unverified).toBe(true);
    });

    it('multiple incoming transfers match → unverified, no mismatch comparison', () => {
      const sim = makeSimulation({
        incoming: [
          { fungibleId: 'usdc', quantity: '50' },
          { fungibleId: 'usdc', quantity: '60' },
        ],
      });
      const r = resolveTransactionWarning({
        ...baseInputs,
        simulationResult: sim,
      });
      expect(r.unverified).toBe(true);
      // Even though sum (110) is >1% off the quote (100), we don't fire mismatch
      // because the multi-match case routes to UnverifiedWarning instead.
      expect(r.warning).toBeNull();
    });

    it('Gray severity coexists with Yellow severity (parallel UI)', () => {
      const sim = makeSimulation({
        warnings: [
          {
            severity: 'Gray',
            title: 'Unverified',
            description: '',
            details: '',
          },
          { severity: 'Yellow', title: 'Risky', description: 'd', details: '' },
        ],
        incoming: [{ fungibleId: 'usdc', quantity: '100' }],
      });
      const r = resolveTransactionWarning({
        ...baseInputs,
        simulationResult: sim,
      });
      expect(r.unverified).toBe(true); // UnverifiedWarning shows
      expect(r.warning?.title).toBe('Risky'); // TransactionWarning shows too
      expect(r.dangerTitle).toBe('Proceed Anyway');
    });
  });

  describe('form-state warnings (existing behavior preserved)', () => {
    it('quote.error code 1 → Insufficient balance warning (no danger, no block)', () => {
      const quote = {
        outputAmount: {
          currency: 'usd',
          quantity: '100',
          value: null,
          usdValue: null,
        },
        error: { code: 1, message: 'Need more ETH' },
      } as unknown as Quote2;
      const r = resolveTransactionWarning({
        ...baseInputs,
        quote,
        simulationResult: null,
      });
      expect(r.warning?.title).toBe('Insufficient balance');
      expect(r.warning?.variant).toBe('warning');
      expect(r.dangerTitle).toBeNull();
      expect(r.blocksAutoSign).toBe(false);
    });

    it('quote.error generic code → Transaction will fail variant error', () => {
      const quote = {
        outputAmount: {
          currency: 'usd',
          quantity: '100',
          value: null,
          usdValue: null,
        },
        error: { code: 99, message: 'unknown' },
      } as unknown as Quote2;
      const r = resolveTransactionWarning({
        ...baseInputs,
        quote,
        simulationResult: null,
      });
      expect(r.warning?.title).toBe('Transaction will fail');
      expect(r.warning?.variant).toBe('error');
      // Form-state warnings don't trigger danger (button is disabled by quote.error)
      expect(r.dangerTitle).toBeNull();
    });

    it('cross-chain to non-bridging network', () => {
      const r = resolveTransactionWarning({
        ...baseInputs,
        formState: { ...baseFormState, outputChain: 'unbridgeable' },
        outputNetwork: {
          ...ethereum,
          id: 'unbridgeable',
          name: 'Unbridgeable',
          supports_bridging: false,
        } as NetworkConfig,
        simulationResult: null,
      });
      expect(r.warning?.title).toContain('doesn’t support bridging');
    });
  });
});
