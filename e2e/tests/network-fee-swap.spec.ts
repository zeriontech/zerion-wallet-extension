import { expect } from '@playwright/test';
import type { BrowserContext, Locator, Page, Route } from '@playwright/test';
import { testWallets } from 'e2e/fixtures/constants';
import { createExtensionTest } from './test';

const test = createExtensionTest({ headless: true });

const RECIPIENT = '0xea79c0adb4f9d249770a8752fc6c0020999c52a0';
const SLOW = 'Slow selected';
const CUSTOM = 'Custom fee selected';
const SWITCH = 'Switch to Fast';
const ETH_CHAIN = 'ethereum';
const BSC_CHAIN = 'binance-smart-chain';

function fungible(id: string, symbol: string, price: number) {
  return {
    id,
    name: symbol,
    symbol,
    implementations: {
      [ETH_CHAIN]: { address: null, decimals: 18 },
      [BSC_CHAIN]: { address: null, decimals: 18 },
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

function position(
  chain: string,
  fungibleId: string,
  symbol: string,
  price: number,
  quantity: string
) {
  return {
    id: `${fungibleId}-${chain}`,
    amount: {
      currency: 'usd',
      quantity,
      value: Number(quantity) * price,
      usdValue: Number(quantity) * price,
    },
    fungible: fungible(fungibleId, symbol, price),
    chain: { id: chain, name: chain, iconUrl: '' },
  };
}

function evm({ chainId, classic }: { chainId: string; classic: boolean }) {
  return {
    type: classic ? '0x0' : '0x2',
    from: testWallets.alice.address,
    to: RECIPIENT,
    nonce: '0x0',
    chainId,
    gas: '0x5208',
    gasPrice: classic ? '0xee6b2800' : null,
    maxFee: classic ? null : '0x6fc23ac00',
    maxPriorityFee: classic ? null : '0x77359400',
    value: '0x0',
    data: '0x',
    customData: null,
  };
}

function quote(chain: string, classic: boolean) {
  const chainId = chain === ETH_CHAIN ? '0x1' : '0x38';
  const amount = { currency: 'usd', quantity: '2', value: 2, usdValue: 2 };
  return {
    contractMetadata: {
      id: `test-${chain}`,
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
    rate: [{ value: 2000, symbol: chain === ETH_CHAIN ? 'ETH' : 'BNB' }],
    time: null,
    networkFee: {
      free: false,
      amount: { currency: 'usd', quantity: '0.0001', value: 3, usdValue: 3 },
      fungible: null,
    },
    transactionApprove: null,
    transactionSwap: { evm: evm({ chainId, classic }), solana: null },
    autoSlippage: null,
    finalSlippage: 0.5,
  };
}

function feeText(locator: Locator) {
  return locator.textContent().then((text) => {
    const match = (text ?? '').match(/(\$[\d.,]+|\d[\d.,]*\s*[A-Za-z]{2,})$/);
    expect(match, `No fee text in "${text}"`).not.toBeNull();
    return match![0].trim();
  });
}

function chainParam(url: string) {
  return new URL(url).searchParams.get('chain') ?? ETH_CHAIN;
}

function inputChainParam(url: string) {
  return new URL(url).searchParams.get('inputChain') ?? ETH_CHAIN;
}

async function setupRoutes({ context }: { context: BrowserContext }) {
  await context.route('**/chain/get-gas-prices/v1*', async (route: Route) => {
    const classic = chainParam(route.request().url()) === BSC_CHAIN;
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: classic
          ? {
              average: {
                classic: 3_000_000_000,
                eip1559: null,
                optimistic: null,
                eta: null,
              },
              fast: {
                classic: 4_000_000_000,
                eip1559: null,
                optimistic: null,
                eta: null,
              },
            }
          : {
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

  await context.route(
    '**/wallet/get-simple-positions/v1*',
    async (route: Route) => {
      const data = [
        position(ETH_CHAIN, 'eth', 'ETH', 2000, '1'),
        position(ETH_CHAIN, 'usdc', 'USDC', 1, '0'),
        position(BSC_CHAIN, 'bnb', 'BNB', 600, '1'),
        position(BSC_CHAIN, 'usdc', 'USDC', 1, '0'),
      ];
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data, meta: null, errors: null }),
      });
    }
  );

  await context.route('**/transaction/get-send/v1*', async (route: Route) => {
    const chain = chainParam(route.request().url());
    const classic = chain === BSC_CHAIN;
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: {
          inputAmount: {
            currency: 'usd',
            quantity: '0.001',
            value: 2.26,
            usdValue: 2.26,
          },
          error: null,
          networkFee: {
            free: false,
            amount: { quantity: '0.0001', value: 3, usdValue: 3 },
            fungible: null,
          },
          transactionSend: {
            evm: evm({
              chainId: chain === ETH_CHAIN ? '0x1' : '0x38',
              classic,
            }),
            solana: null,
          },
        },
        meta: null,
        errors: null,
      }),
    });
  });

  await context.route(
    '**/transaction/stream-swap-quotes/v2*',
    async (route: Route) => {
      const chain = inputChainParam(route.request().url());
      const classic = chain === BSC_CHAIN;
      await route.fulfill({
        status: 200,
        contentType: 'text/event-stream',
        body: `data: ${JSON.stringify([
          quote(chain, classic),
        ])}\n\nevent: end\ndata: {}\n\n`,
      });
    }
  );
}

async function dismissSwapOnboarding(page: Page) {
  const continueButton = page.getByRole('button', { name: 'Continue' });
  if (await continueButton.count()) {
    await continueButton.click();
  }
}

async function openSwap(page: Page, extensionPopupUrl: string, chain: string) {
  await page.setViewportSize({ width: 440, height: 700 });
  const params = new URLSearchParams({
    inputChain: chain,
    inputFungibleId: chain === ETH_CHAIN ? 'eth' : 'bnb',
    inputAmount: '0.001',
    outputChain: chain,
    outputFungibleId: 'usdc',
  });
  await page.goto(`${extensionPopupUrl}#/swap-form?${params}`);
  await expect(
    page.getByText('Network Fee', { exact: true }).last()
  ).toBeVisible({ timeout: 30_000 });
  await dismissSwapOnboarding(page);
  return page.getByRole('button').filter({ hasText: 'Network Fee' }).first();
}

async function openSend(page: Page, extensionPopupUrl: string, chain: string) {
  await page.setViewportSize({ width: 440, height: 700 });
  const params = new URLSearchParams({
    inputChain: chain,
    inputFungibleId: chain === ETH_CHAIN ? 'eth' : 'bnb',
    inputAmount: '0.001',
    to: RECIPIENT,
  });
  await page.goto(`${extensionPopupUrl}#/send-form?${params}`);
  const row = page
    .getByRole('button')
    .filter({ hasText: 'Network Fee' })
    .first();
  await expect(row).toBeVisible({ timeout: 30_000 });
  return row;
}

test('Swap on Ethereum keeps row, picker and custom form in sync', async ({
  context,
  page,
  extensionPopupUrl,
}) => {
  await setupRoutes({ context });
  const row = await openSwap(page, extensionPopupUrl, ETH_CHAIN);
  await expect(page.getByText(SLOW)).toHaveCount(0);

  await row.click();
  await page.getByRole('button', { name: /Slow icon/ }).click();
  await expect(page.getByText(SLOW)).toBeVisible();
  const slowRowText = await feeText(row);
  await row.click();
  const slowPicker = page.getByRole('button', { name: /Slow icon/ });
  await expect(slowPicker).toHaveAttribute('aria-pressed', 'true');
  const slowPickerText = await feeText(slowPicker);
  expect(slowRowText).toBe(slowPickerText);
  await page.keyboard.press('Escape');

  await page.getByRole('button', { name: SWITCH }).click();
  await expect(page.getByText(SLOW)).toHaveCount(0);

  await row.click();
  const customRow = page.getByRole('button', { name: /Custom icon/ });
  const customPickerText = await feeText(customRow);
  await customRow.click();
  const expectedFeeText = await feeText(
    page.getByText('Expected Fee').locator('..')
  );
  expect(expectedFeeText).toBe(customPickerText);
  await page.locator('input[name="maxFee"]').fill('35');
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByText(CUSTOM)).toBeVisible();
  await expect(row).toContainText(customPickerText);

  // Switching to Fast keeps the values available in the custom form.
  await page.getByRole('button', { name: SWITCH }).click();
  await expect(page.getByText(CUSTOM)).toHaveCount(0);
  await row.click();
  await page.getByRole('button', { name: /Custom icon/ }).click();
  await expect(page.locator('input[name="maxFee"]')).toHaveValue('35');
});

test('Classic Send on BSC prices Slow and Custom consistently', async ({
  context,
  page,
  extensionPopupUrl,
}) => {
  await setupRoutes({ context });
  const row = await openSend(page, extensionPopupUrl, BSC_CHAIN);
  await expect(page.getByText(SLOW)).toHaveCount(0);

  await row.click();
  const slowPicker = page.getByRole('button', { name: /Slow icon/ });
  await expect(slowPicker).not.toContainText('sec');
  await expect(slowPicker).not.toContainText('min');
  await slowPicker.click();
  await expect(page.getByText(SLOW)).toBeVisible();
  const slowRowText = await feeText(row);
  await row.click();
  const slowPickerText = await feeText(
    page.getByRole('button', { name: /Slow icon/ })
  );
  expect(slowRowText).toBe(slowPickerText);
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: SWITCH }).click();

  await row.click();
  const customRow = page.getByRole('button', { name: /Custom icon/ });
  const customPickerText = await feeText(customRow);
  await customRow.click();
  const expectedFeeText = await feeText(
    page.getByText('Expected Fee').locator('..')
  );
  expect(expectedFeeText).toBe(customPickerText);
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByText(CUSTOM)).toBeVisible();
  await expect(row).toContainText(customPickerText);
});

test('Classic Swap on BSC prices Slow and Custom consistently', async ({
  context,
  page,
  extensionPopupUrl,
}) => {
  await setupRoutes({ context });
  const row = await openSwap(page, extensionPopupUrl, BSC_CHAIN);
  await expect(page.getByText(SLOW)).toHaveCount(0);

  await row.click();
  const slowPicker = page.getByRole('button', { name: /Slow icon/ });
  await expect(slowPicker).not.toContainText('sec');
  await expect(slowPicker).not.toContainText('min');
  await slowPicker.click();
  await expect(page.getByText(SLOW)).toBeVisible();
  const slowRowText = await feeText(row);
  await row.click();
  const slowPickerText = await feeText(
    page.getByRole('button', { name: /Slow icon/ })
  );
  expect(slowRowText).toBe(slowPickerText);
  await page.keyboard.press('Escape');

  await row.click();
  const customRow = page.getByRole('button', { name: /Custom icon/ });
  const customPickerText = await feeText(customRow);
  await customRow.click();
  const expectedFeeText = await feeText(
    page.getByText('Expected Fee').locator('..')
  );
  expect(expectedFeeText).toBe(customPickerText);
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByText(CUSTOM)).toBeVisible();
  await expect(row).toContainText(customPickerText);
});

test('Send Slow carries into Swap and another chain starts Fast', async ({
  context,
  page,
  extensionPopupUrl,
}) => {
  await setupRoutes({ context });
  const sendRow = await openSend(page, extensionPopupUrl, ETH_CHAIN);
  await sendRow.click();
  await page.getByRole('button', { name: /Slow icon/ }).click();
  await expect(page.getByText(SLOW)).toBeVisible();

  const swapRow = await openSwap(page, extensionPopupUrl, ETH_CHAIN);
  await expect(page.getByText(SLOW)).toBeVisible();
  await swapRow.click();
  const slowPicker = page.getByRole('button', { name: /Slow icon/ });
  await expect(slowPicker).toHaveAttribute('aria-pressed', 'true');
  await page.keyboard.press('Escape');

  // A different chain has no saved Slow preference.
  await openSend(page, extensionPopupUrl, BSC_CHAIN);
  await expect(page.getByText(SLOW)).toHaveCount(0);
  await expect(page.getByRole('button', { name: SWITCH })).toHaveCount(0);
});
