import type { CustomConfiguration } from 'src/shared/types/TransactionConfiguration';
import type { ChainGasPrice } from 'src/modules/ethereum/transactions/gasPrices/types';
import type { Quote2, TransactionEVM } from 'src/shared/types/Quote';
import { buildSimulationTransactions } from './buildSimulationTransactions';

function makeEvm(overrides: Partial<TransactionEVM>): TransactionEVM {
  return {
    type: '0x2',
    from: '0xfrom',
    to: '0xto',
    nonce: '0x0',
    chainId: '0x1',
    gas: '0x100',
    gasPrice: null,
    maxFee: null,
    maxPriorityFee: null,
    value: '0x0',
    data: '0x',
    customData: null,
    ...overrides,
  };
}

const PRESET_FAST: CustomConfiguration = {
  nonce: null,
  slippage: null,
  networkFee: {
    speed: 'fast',
    custom1559GasPrice: null,
    customClassicGasPrice: null,
    gasLimit: null,
  },
};

test('approve and swap sent to simulation carry identical fees', () => {
  const quoted = { maxFee: '0x8f0d1803', maxPriorityFee: '0x2faf0801' };
  const quote = {
    quoteId: 'quote-id',
    intentSwap: null,
    transactionApprove: { evm: makeEvm({ to: '0xtoken', ...quoted }), solana: null },
    transactionSwap: { evm: makeEvm({ to: '0xrouter', ...quoted }), solana: null },
  } as unknown as Quote2;
  const speed = {
    classic: null,
    eip1559: { maxFee: 2496980274, priorityFee: 832326758, baseFee: 1664653516 },
    optimistic: null,
    eta: null,
  };
  const gasPrices: ChainGasPrice = { fast: speed, average: speed };

  const list = buildSimulationTransactions(quote, PRESET_FAST, gasPrices);

  expect(list.length).toBe(2);
  const [approve, swap] = list.map((tx) => tx.evm);
  expect(approve?.to).toBe('0xtoken');
  expect(swap?.to).toBe('0xrouter');
  expect(approve?.maxFeePerGas).toBe('0x94d4e532');
  expect(approve?.maxPriorityFeePerGas).toBe('0x319c4c66');
  expect(approve?.maxFeePerGas).toBe(swap?.maxFeePerGas);
  expect(approve?.maxPriorityFeePerGas).toBe(swap?.maxPriorityFeePerGas);
  expect(approve?.gasPrice).toBe(swap?.gasPrice);
});
