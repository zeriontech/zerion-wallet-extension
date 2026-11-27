import { expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { createExtensionTest } from './test';

const extensionTest = createExtensionTest();
const { describe } = extensionTest;

const HYPERLIQUID_ORIGIN = 'https://app.hyperliquid.xyz';
const CORS = { 'access-control-allow-origin': '*' };
const CONFIG = {
  builderAddress: '0x00000000000000000000000000000000000000aa',
  builderFee: 40,
  builderFeePremium: 20,
  referralCode: 'ZERIONAPP',
  maxApproveBuilderFee: '0.1%',
  maxApproveBuilderFeeInteger: 100,
  withdrawalFeeUsd: 1,
  minimumPositionSizeUsd: 10,
  supportedCollateralTokens: [0],
  supportedDexes: [],
  tokenizedAssetDexes: [],
};
const POSITIONS = {
  data: [
    {
      id: 'usdc-base',
      amount: { currency: 'usd', quantity: '2410.55', value: 2410.55, usdValue: 2410.55 },
      fungible: {
        id: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913',
        symbol: 'USDC',
        name: 'USD Coin',
        iconUrl: '',
        meta: { price: 1 },
      },
      chain: { id: 'base', name: 'Base', iconUrl: '' },
    },
    {
      id: 'eth-ethereum',
      amount: { currency: 'usd', quantity: '1.5', value: 5120.8, usdValue: 5120.8 },
      fungible: {
        id: 'eth',
        symbol: 'ETH',
        name: 'Ether',
        iconUrl: '',
        meta: { price: 3413.87 },
      },
      chain: { id: 'ethereum', name: 'Ethereum', iconUrl: '' },
    },
  ],
  meta: null,
  errors: null,
};
const CLEARINGHOUSE_STATE = {
  marginSummary: {
    accountValue: '12480.22',
    totalNtlPos: '18964.14',
    totalRawUsd: '12480.22',
    totalMarginUsed: '4778.79',
  },
  crossMarginSummary: {
    accountValue: '12480.22',
    totalNtlPos: '18964.14',
    totalRawUsd: '12480.22',
    totalMarginUsed: '4778.79',
  },
  withdrawable: '7701.43',
  assetPositions: [
    {
      type: 'oneWay',
      position: {
        coin: 'BTC',
        szi: '0.12',
        entryPx: '94660',
        positionValue: '11569.44',
        leverage: { type: 'cross', value: 5 },
        marginUsed: '2313.89',
        unrealizedPnl: '210.18',
        returnOnEquity: '0.091',
        liquidationPx: '76890',
        maxLeverage: 40,
        cumFunding: { allTime: '0', sinceChange: '0', sinceOpen: '0' },
      },
    },
    {
      type: 'oneWay',
      position: {
        coin: 'ETH',
        szi: '-2.1',
        entryPx: '3570',
        positionValue: '7394.7',
        leverage: { type: 'cross', value: 3 },
        marginUsed: '2464.9',
        unrealizedPnl: '102.22',
        returnOnEquity: '0.041',
        liquidationPx: '4612.4',
        maxLeverage: 25,
        cumFunding: { allTime: '0', sinceChange: '0', sinceOpen: '0' },
      },
    },
  ],
  time: 0,
};
const QUOTE = {
  contractMetadata: { id: 'test-bridge', name: 'Test Bridge', iconUrl: '', explorer: null },
  outputAmount: { currency: 'usdc', quantity: '999.2', value: 999.2, usdValue: 999.2 },
  outputAmountAfterFees: { currency: 'usdc', quantity: '999.2', value: 999.2, usdValue: 999.2 },
  minimumOutputAmount: { currency: 'usdc', quantity: '997', value: 997, usdValue: 997 },
  error: null,
  protocolFee: {
    basePercentage: 0,
    percentage: 0,
    fungible: null,
    amount: { currency: 'usdc', quantity: '0.5', value: 0.5, usdValue: 0.5 },
  },
  bridgeFee: {
    fungible: null,
    amount: { currency: 'usdc', quantity: '1.2', value: 1.2, usdValue: 1.2 },
  },
  rate: [],
  networkFee: {
    free: false,
    amount: { currency: 'usd', quantity: '0.8', value: 0.8, usdValue: 0.8 },
    fungible: null,
  },
  transactionApprove: null,
  transactionSwap: {
    evm: {
      type: '0x2',
      from: '0xc3A6672F5c9Ef31E5a086B1C80Ba1Ac73F95Cbb1',
      to: '0x00000000000000000000000000000000000000aa',
      nonce: '0x1',
      chainId: '0x2105',
      gas: '0x1',
      gasPrice: null,
      maxFee: '0x1',
      maxPriorityFee: '0x1',
      value: '0x0',
      data: '0x',
      customData: null,
    },
    solana: null,
  },
  intentSwap: null,
  intentApprove: null,
  quoteId: 'quote-1',
  autoSlippage: null,
  finalSlippage: null,
};

async function mockBase(page: Page) {
  await page.route('https://proxy.zerion.io/remote-config**', async (route) => {
    const url = new URL(route.request().url());
    if (url.searchParams.get('key') === 'hyperliquid_perps_config') {
      await route.fulfill({ json: { hyperliquid_perps_config: CONFIG }, headers: CORS });
      return;
    }
    await route.continue();
  });
  await page.route('**/wallet/simulate-signature/v1', (route) =>
    route.fulfill({ json: { data: { action: null, warnings: [] } }, headers: CORS }),
  );
  await page.route('https://api.hyperliquid.xyz/info', async (route) => {
    const body = route.request().postDataJSON() as { type?: string } | null;
    switch (body?.type) {
      case 'perpDexs':
        await route.fulfill({ json: [], headers: CORS });
        return;
      case 'clearinghouseState':
        await route.fulfill({ json: CLEARINGHOUSE_STATE, headers: CORS });
        return;
      case 'spotClearinghouseState':
        await route.fulfill({ json: { balances: [] }, headers: CORS });
        return;
      case 'userAbstraction':
        await route.fulfill({ json: 'default', headers: CORS });
        return;
      case 'referral':
        await route.fulfill({ json: { referredBy: null }, headers: CORS });
        return;
      case 'approvedBuilders':
        await route.fulfill({ json: [], headers: CORS });
        return;
      case 'maxBuilderFee':
        await route.fulfill({ json: 0, headers: CORS });
        return;
      default:
        await route.fulfill({ json: null, headers: CORS });
    }
  });
}

async function mockPositions(page: Page) {
  await page.route('**/wallet/get-simple-positions/v1*', (route) =>
    route.fulfill({ json: POSITIONS, headers: CORS }),
  );
  await page.route('**/chain/get-gas-prices/v1*', (route) =>
    route.fulfill({
      json: {
        data: {
          average: {
            classic: 1,
            eip1559: { maxFee: 1, priorityFee: 1, baseFee: 0 },
            optimistic: null,
            eta: null,
          },
          fast: {
            classic: 1,
            eip1559: { maxFee: 1, priorityFee: 1, baseFee: 0 },
            optimistic: null,
            eta: null,
          },
        },
      },
      headers: CORS,
    }),
  );
  await page.route('**/transaction/stream-swap-quotes/v3*', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'text/event-stream',
      headers: CORS,
      body: `event: update\ndata: ${JSON.stringify([QUOTE])}\n\n`,
    }),
  );
}

describe('bapr capture', () => {
  extensionTest('capture', async ({ page, extensionPopupUrl }) => {
    const surface = process.env.BAPR_SURFACE;
    const out = process.env.BAPR_OUT;
    if (!surface || !out) throw new Error('BAPR_SURFACE and BAPR_OUT are required');
    await page.setViewportSize({ width: 400, height: 800 });
    await mockBase(page);

    if (surface === 'referral') {
      const params = new URLSearchParams({
        origin: HYPERLIQUID_ORIGIN,
        windowId: 'bapr-referral',
        ecosystem: 'evm',
      });
      await page.goto(`${extensionPopupUrl}#/requestAccounts?${params.toString()}`);
      await page.getByRole('button', { name: /^Connect$/ }).click();
      await expect(page.getByText('Save 4% on Hyperliquid fees')).toBeVisible({
        timeout: 30_000,
      });
      await page.screenshot({ path: out });
      return;
    }

    if (surface === 'card') {
      await page.goto(`${extensionPopupUrl}#/overview`);
      await expect(page.getByRole('button', { name: 'Send' })).toBeVisible({ timeout: 30_000 });
      if (process.env.BAPR_EXPECT_CARD === '1') {
        await expect(page.getByTestId('hyperliquid-account-card')).toBeVisible({
          timeout: 30_000,
        });
      }
      await page.waitForTimeout(1200);
      await page.screenshot({ path: out });
      return;
    }

    if (surface === 'deposit') {
      await mockPositions(page);
      const params = new URLSearchParams({
        inputChain: 'ethereum',
        inputFungibleId: 'eth',
        inputAmount: '1000',
        inputKind: 'token',
      });
      await page.goto(`${extensionPopupUrl}#/perps/deposit?${params.toString()}`);
      const dismiss = page.getByRole('button', { name: 'Dismiss onboarding' });
      await dismiss.waitFor({ state: 'visible', timeout: 10_000 }).catch(() => {});
      if (await dismiss.isVisible()) await dismiss.click();
      await expect(page.getByText('on Hyperliquid', { exact: true })).toBeVisible({
        timeout: 30_000,
      });
      if (process.env.BAPR_EXPECT_FEES === '1') {
        await expect(page.getByText('Network Fee')).toBeVisible({ timeout: 20_000 });
        await page.getByText('Details', { exact: true }).click();
        await expect(page.getByText('Zerion Fee')).toBeVisible();
      }
      await page.waitForTimeout(600);
      await page.screenshot({ path: out });
      return;
    }

    throw new Error(`Unknown BAPR_SURFACE: ${surface}`);
  });
});
