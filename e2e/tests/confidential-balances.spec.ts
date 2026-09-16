import { expect } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';
import { createExtensionTest } from './test';

const test = createExtensionTest({ headless: true });

const SHOTS = process.env.CONFIDENTIAL_QA_SHOTS;
async function shot(page: Page, name: string) {
  if (!SHOTS) {
    return;
  }
  // let the dialog / crossfade animations settle before capturing
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${SHOTS}/${name}.png` });
}

/**
 * Ariakit only shows a hovercard for a pointer that is actually moving, and a
 * single synthetic `hover()` move isn't enough — take two steps inside the
 * element the way a real pointer would.
 */
async function hoverMoving(page: Page, locator: Locator) {
  const box = await locator.boundingBox();
  if (!box) {
    throw new Error('Element to hover has no box');
  }
  await page.mouse.move(box.x + box.width / 2 - 4, box.y + box.height / 2);
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
}

function fakePositions(encrypted: boolean) {
  const chain = {
    id: 'ethereum',
    name: 'Ethereum',
    testnet: false,
    iconUrl: 'https://chain-icons.s3.amazonaws.com/ethereum.png',
  };
  const usdcAsset = {
    id: 'cusdc-confidential-mock',
    iconUrl:
      'https://cdn.zerion.io/0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48.png',
    name: 'Confidential USDC',
    price: { value: 1, relativeChange24h: 0, changedAt: 0 },
    symbol: 'cUSDC',
    isDisplayable: true,
    isVerified: true,
    implementations: {
      ethereum: {
        address: '0x1111111111111111111111111111111111111111',
        decimals: 6,
      },
    },
  };
  const ethAsset = {
    id: 'eth',
    iconUrl: 'https://cdn.zerion.io/eth.png',
    name: 'Ethereum',
    price: { value: 3000, relativeChange24h: 1.2, changedAt: 0 },
    symbol: 'ETH',
    isDisplayable: true,
    isVerified: true,
    implementations: { ethereum: { address: null, decimals: 18 } },
  };
  return [
    {
      apy: null,
      asset: ethAsset,
      chain,
      id: 'eth-ethereum-asset',
      includedInChart: true,
      name: 'Asset',
      parentId: null,
      protocol: null,
      quantity: '500000000000000000',
      type: 'asset',
      value: '1500',
      isDisplayable: true,
      dapp: null,
    },
    {
      apy: null,
      asset: usdcAsset,
      chain,
      id: 'cusdc-confidential-mock',
      includedInChart: false,
      name: 'Asset',
      parentId: null,
      protocol: null,
      quantity: encrypted ? '0' : '4210000000',
      type: 'asset',
      value: encrypted ? '0' : '4210',
      isDisplayable: true,
      dapp: null,
      encrypted,
    },
    {
      apy: '3.1',
      asset: ethAsset,
      chain,
      id: 'aave-eth-deposit',
      includedInChart: true,
      name: 'Deposit',
      parentId: null,
      protocol: 'aave-v3',
      quantity: '100000000000000000',
      type: 'deposit',
      value: '300',
      isDisplayable: true,
      dapp: {
        id: 'aave-v3',
        name: 'Aave V3',
        url: 'https://app.aave.com',
        iconUrl: null,
      },
    },
  ];
}

/**
 * Drives the Confidential Balances flow against a mocked positions endpoint:
 * the wallet is Locked (one encrypted position) until the request carries
 * Signed Permits, which the dev-menu "fake permits" override lets the wallet
 * sign without the backend. Runs in a popup-sized viewport.
 */
test('confidential balances: panel → reveal → unmasked', async ({
  context,
  page,
  extensionPopupUrl,
}) => {
  await page.setViewportSize({ width: 400, height: 640 });
  const positionsPermits: unknown[][] = [];
  const portfolioPermits: unknown[][] = [];
  await context.route('**/wallet/get-positions/v1', async (route) => {
    const body = JSON.parse(route.request().postData() || '{}');
    const permits: unknown[] = body.permits ?? [];
    if (permits.length) {
      positionsPermits.push(permits);
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: fakePositions(permits.length === 0) }),
    });
  });
  const actionsPermits: unknown[][] = [];
  await context.route('**/wallet/get-actions/v1', async (route) => {
    const body = JSON.parse(route.request().postData() || '{}');
    const permits: unknown[] = body.permits ?? [];
    if (permits.length) {
      actionsPermits.push(permits);
    }
    await route.continue();
  });
  await context.route('**/wallet/get-portfolio/v1', async (route) => {
    const body = JSON.parse(route.request().postData() || '{}');
    const permits: unknown[] = body.permits ?? [];
    if (permits.length) {
      portfolioPermits.push(permits);
    }
    await route.continue();
  });

  await page.goto(`${extensionPopupUrl}#/overview`);
  await page.evaluate(() =>
    localStorage.setItem(
      'dev-menu-overrides',
      JSON.stringify({ confidentialPermitsOverride: 'fake' })
    )
  );
  await page.reload();

  // Locked: panel above the positions groups, masks in the row
  const panel = page.getByRole('button', { name: /Confidential Balances/ });
  await expect(panel).toBeVisible({ timeout: 20000 });
  await expect(page.getByText('Confidential USDC')).toBeVisible();
  const masks = page.getByRole('button', { name: /Encrypted balance/ });
  await expect(masks.first()).toBeVisible();
  const maskCount = await masks.count();
  expect(maskCount).toBeGreaterThanOrEqual(2);
  await shot(page, '1-locked-overview');

  // Hovering the panel or a mask shows the explainer card (with the
  // decrypt animation); moving away hides it. The hovercard never takes
  // focus or swallows the click, so the controls below still open the dialog.
  const infoCard = page.locator('[class*="_infoCard"]');
  await hoverMoving(page, panel);
  await expect(infoCard).toBeVisible();
  await shot(page, '1a-panel-hovercard');
  await page.mouse.move(10, 10);
  await expect(infoCard).toBeHidden();
  await hoverMoving(page, masks.first());
  await expect(infoCard).toBeVisible();
  await shot(page, '1b-mask-hovercard');
  await page.mouse.move(10, 10);
  await expect(infoCard).toBeHidden();

  // Tapping a mask opens the dialog too, and the hovercard gets out of the way
  await hoverMoving(page, masks.first());
  await expect(infoCard).toBeVisible();
  await masks.first().click();
  await expect(
    page.getByRole('button', { name: 'Reveal', exact: true })
  ).toBeVisible();
  await expect(infoCard).toBeHidden();
  // the decrypt animation (illustrative "4,210" USDC row) lives in the
  // hovercard now, not in the dialog card
  await expect(page.getByText('4,210', { exact: true })).toHaveCount(0);
  await shot(page, '2-dialog-from-mask');
  await page.keyboard.press('Escape');
  await expect(
    page.getByRole('button', { name: 'Reveal', exact: true })
  ).toBeHidden();

  // Panel → dialog → Reveal
  await panel.click();
  const reveal = page.getByRole('button', { name: 'Reveal', exact: true });
  await expect(reveal).toBeVisible();
  await expect(
    page.getByText(/Decrypt them with your wallet to reveal/)
  ).toBeVisible();
  await shot(page, '3-dialog-from-panel');
  await reveal.click();
  await expect(page.getByText('Decrypting balances…')).toBeVisible();
  await shot(page, '4-decrypting');

  // Dialog closes once positions refetched with permits; masks and panel gone
  await expect(page.getByText('Decrypting balances…')).toBeHidden({
    timeout: 20000,
  });
  await expect(reveal).toBeHidden();
  await expect(panel).toBeHidden();
  await expect(masks).toHaveCount(0);
  await expect(page.getByText('4,210 cUSDC')).toBeVisible();
  await shot(page, '5-revealed');

  expect(positionsPermits.length).toBeGreaterThan(0);
  expect(positionsPermits[0]).toHaveLength(3);
  for (const permit of positionsPermits[0] as Record<string, unknown>[]) {
    expect(Object.keys(permit).sort()).toEqual([
      'address',
      'contracts',
      'expireAt',
      'signature',
    ]);
    expect(String(permit.signature)).toMatch(/^0x[0-9a-f]{130}$/);
  }
  expect(portfolioPermits.length).toBeGreaterThan(0);

  // Persistence: after a reload the wallet is still revealed (the positions
  // come from the permit-keyed cache) and a fresh request — History — still
  // carries the stored permits
  await page.reload();
  await expect(page.getByText('4,210 cUSDC')).toBeVisible({ timeout: 20000 });
  await expect(panel).toBeHidden();
  await page.getByRole('link', { name: 'History' }).click();
  await expect
    .poll(() => actionsPermits.length, { timeout: 20000 })
    .toBeGreaterThan(0);
  expect(actionsPermits[0]).toHaveLength(3);
});
