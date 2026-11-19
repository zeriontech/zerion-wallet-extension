import { expect } from '@playwright/test';
import type { BrowserContext, Page, Route } from '@playwright/test';
import { testWallets } from 'e2e/fixtures/constants';
import { createExtensionTest } from './test';

const test = createExtensionTest();

const ETH_CHAIN = 'ethereum';
// 50.0324 × 0.9995 = 50.0073838, which rounds up to $50.01. Resolving that
// rounded amount back to tokens gives 50.0350175…, more than the balance.
const USDC_BALANCE = '50.0324';
const USDC_PRICE = 0.9995;

function fungible(id: string, symbol: string, price: number) {
  return {
    id,
    name: symbol,
    symbol,
    implementations: {
      [ETH_CHAIN]: { address: null, decimals: 18 },
    },
    iconUrl: null,
    verified: true,
    new: false,
    meta: {
      price,
      circulatingSupply: null,
      totalSupply: null,
      marketCap: null,
    },
  };
}

function position(fungibleId: string, symbol: string, price: number, quantity: string) {
  return {
    id: `${fungibleId}-${ETH_CHAIN}`,
    amount: {
      currency: 'usd',
      quantity,
      value: Number(quantity) * price,
      usdValue: Number(quantity) * price,
    },
    fungible: fungible(fungibleId, symbol, price),
    chain: { id: ETH_CHAIN, name: ETH_CHAIN, iconUrl: '' },
  };
}

function quote() {
  const amount = { currency: 'usd', quantity: '2', value: 2, usdValue: 2 };
  return {
    contractMetadata: {
      id: 'test-ethereum',
      name: 'Test',
      iconUrl: '',
      explorer: null,
    },
    outputAmount: amount,
    outputAmountAfterFees: amount,
    minimumOutputAmount: amount,
    error: null,
    protocolFee: {
      basePercentage: 0,
      percentage: 0,
      fungible: null,
      amount: { currency: 'usd', quantity: '0', value: 0, usdValue: 0 },
    },
    bridgeFee: null,
    rate: [{ value: 2000, symbol: 'ETH' }],
    time: null,
    networkFee: {
      free: false,
      amount: { currency: 'usd', quantity: '0.0001', value: 3, usdValue: 3 },
      fungible: null,
    },
    transactionApprove: null,
    transactionSwap: {
      evm: {
        type: '0x2',
        from: testWallets.alice.address,
        to: '0xea79c0adb4f9d249770a8752fc6c0020999c52a0',
        nonce: '0x0',
        chainId: '0x1',
        gas: '0x5208',
        gasPrice: null,
        maxFee: '0x6fc23ac00',
        maxPriorityFee: '0x77359400',
        value: '0x0',
        data: '0x',
        customData: null,
      },
      solana: null,
    },
    autoSlippage: null,
    finalSlippage: 0.5,
  };
}

async function setupRoutes({
  context,
  quoteAmounts,
}: {
  context: BrowserContext;
  quoteAmounts: (string | null)[];
}) {
  await context.route('**/chain/get-gas-prices/v1*', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: {
          average: {
            classic: null,
            eip1559: {
              maxFee: 20_000_000_000,
              priorityFee: 1_000_000_000,
              baseFee: 15_000_000_000,
            },
            optimistic: null,
            eta: 60,
          },
          fast: {
            classic: null,
            eip1559: {
              maxFee: 30_000_000_000,
              priorityFee: 2_000_000_000,
              baseFee: 15_000_000_000,
            },
            optimistic: null,
            eta: 15,
          },
        },
        errors: null,
        meta: null,
      }),
    });
  });

  await context.route('**/wallet/get-simple-positions/v1*', async (route: Route) => {
    const data = [
      position('usdc', 'USDC', USDC_PRICE, USDC_BALANCE),
      position('eth', 'ETH', 2000, '1'),
    ];
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data, meta: null, errors: null }),
    });
  });

  await context.route('**/transaction/stream-swap-quotes/v2*', async (route: Route) => {
    quoteAmounts.push(new URL(route.request().url()).searchParams.get('inputAmount'));
    await route.fulfill({
      status: 200,
      contentType: 'text/event-stream',
      body: `data: ${JSON.stringify([quote()])}\n\nevent: end\ndata: {}\n\n`,
    });
  });
}

async function openSwapInCurrencyMode(page: Page, extensionPopupUrl: string) {
  await page.setViewportSize({ width: 440, height: 700 });
  const params = new URLSearchParams({
    inputChain: ETH_CHAIN,
    inputFungibleId: 'usdc',
    inputKind: 'currency',
    outputChain: ETH_CHAIN,
    outputFungibleId: 'eth',
  });
  await page.goto(`${extensionPopupUrl}#/swap-form?${params}`);
  const maxButton = page.getByRole('button', { name: 'MAX', exact: true });
  await expect(maxButton).toBeVisible({ timeout: 30_000 });
  return maxButton;
}

test('MAX in USD input mode uses the full balance', async ({
  context,
  page,
  extensionPopupUrl,
}) => {
  const quoteAmounts: (string | null)[] = [];
  await setupRoutes({ context, quoteAmounts });
  const maxButton = await openSwapInCurrencyMode(page, extensionPopupUrl);

  const continueButton = page.getByRole('button', { name: 'Continue' });
  if (await continueButton.isVisible()) {
    await continueButton.click();
  }

  await maxButton.click();

  // The display still rounds to cents…
  await expect(page.locator('input[name="inputAmount"]')).toHaveValue('50.01');

  // …but the quote must ask for the exact balance, never more.
  await expect.poll(() => quoteAmounts.at(-1) ?? null).not.toBeNull();
  expect(quoteAmounts.at(-1)).toBe(USDC_BALANCE);

  // The balance must not be rendered as an error.
  const balanceRow = page.getByText('Balance:', { exact: true }).first().locator('..');
  const color = await balanceRow.evaluate((element) => getComputedStyle(element).color);
  expect(['rgb(255, 74, 74)', 'rgb(255, 92, 92)']).not.toContain(color);
});
