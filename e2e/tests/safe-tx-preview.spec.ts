import { expect } from '@playwright/test';
import type { BrowserContext, Page } from '@playwright/test';
import { createExtensionTest } from './test';

const test = createExtensionTest();

const SAFE_ADDRESS = '0x4a183b7ED67B9E14b3f45Abfb2Cf44ed22c29E54';
const SAFE_ADDRESS_SHORT = '0x4a18…9E54';
const MULTISEND_CALL_ONLY = '0x9641d764fc13c8B624c04430C7356C1C7C8102e2';
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

// Canonical SafeTx typed data, as app.safe.global signs it on Base. The batch
// is the same shape the production backend interpreted for the Zerion fee
// multisig: three ERC-20 transfers through MultiSendCallOnly.
const SAFE_TX_DATA =
  '0x8d80ff0a000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000001cb00833589fcd6edb6e08f4c7c32d4f71b54bda0291300000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000044a9059cbb000000000000000000000000d2003791f755c3d5f0b8522341dfbd0cb3b105cb0000000000000000000000000000000000000000000000000000000000cb514c00420000000000000000000000000000000000000600000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000044a9059cbb000000000000000000000000d2003791f755c3d5f0b8522341dfbd0cb3b105cb0000000000000000000000000000000000000000000000000007b01c331bb00000cbb7c0000ab88b473b1f5afd9ef808440eed33bf00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000044a9059cbb000000000000000000000000d2003791f755c3d5f0b8522341dfbd0cb3b105cb000000000000000000000000000000000000000000000000000000000009735e000000000000000000000000000000000000000000';

const typedData = {
  types: {
    SafeTx: [
      { name: 'to', type: 'address' },
      { name: 'value', type: 'uint256' },
      { name: 'data', type: 'bytes' },
      { name: 'operation', type: 'uint8' },
      { name: 'safeTxGas', type: 'uint256' },
      { name: 'baseGas', type: 'uint256' },
      { name: 'gasPrice', type: 'uint256' },
      { name: 'gasToken', type: 'address' },
      { name: 'refundReceiver', type: 'address' },
      { name: 'nonce', type: 'uint256' },
    ],
    EIP712Domain: [
      { name: 'chainId', type: 'uint256' },
      { name: 'verifyingContract', type: 'address' },
    ],
  },
  domain: { chainId: 8453, verifyingContract: SAFE_ADDRESS },
  primaryType: 'SafeTx',
  message: {
    to: MULTISEND_CALL_ONLY,
    value: '0',
    data: SAFE_TX_DATA,
    operation: 1,
    safeTxGas: '0',
    baseGas: '0',
    gasPrice: '0',
    gasToken: ZERO_ADDRESS,
    refundReceiver: ZERO_ADDRESS,
    nonce: '0',
  },
};

type Warning = {
  severity: 'Red' | 'Orange' | 'Yellow' | 'Gray';
  title: string;
  description: string;
  details: string;
};

const SAFE_NOTE: Warning = {
  severity: 'Gray',
  title: 'Safe transaction',
  description: `Balance changes shown are for Safe ${SAFE_ADDRESS_SHORT}`,
  details: '',
};

const SAFE_NOTE_ORANGE: Warning = {
  severity: 'Orange',
  title: 'This transaction will fail',
  description: 'The simulation shows this Safe transaction will fail with Safe error GS013.',
  details: '',
};

function fungible(id: string, symbol: string, address: string) {
  return {
    id,
    name: symbol,
    symbol,
    implementations: { base: { address, decimals: 18 } },
    iconUrl: null,
    verified: true,
    new: false,
    meta: {
      price: null,
      circulatingSupply: null,
      totalSupply: null,
      marketCap: null,
      fullyDilutedValuation: null,
      relativeChange1d: null,
      relativeChange30d: null,
      relativeChange90d: null,
      relativeChange365d: null,
    },
  };
}

const assets = [
  fungible('usdc-base', 'USDC', '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'),
  fungible('weth-base', 'WETH', '0x4200000000000000000000000000000000000006'),
  fungible('cbbtc-base', 'cbBTC', '0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf'),
];

const chain = { id: 'base', name: 'Base', iconUrl: null };

function transfer(assetIndex: number, quantity: string) {
  return {
    direction: 'out' as const,
    amount: { currency: 'usd', quantity, value: null, usdValue: null },
    fungible: assets[assetIndex],
    nft: null,
  };
}

function act(index: number, quantity: string) {
  return {
    type: { value: 'send' as const, displayValue: 'Send' },
    label: null,
    content: { transfers: [transfer(index, quantity)], approvals: null },
    rate: null,
    status: 'confirmed' as const,
    transaction: { chain, hash: '0x', explorerUrl: null },
  };
}

const successAction = {
  address: SAFE_ADDRESS,
  id: '0x57c0547e56cc4a4f8369d45de8f27dda',
  timestamp: 1_763_000_000,
  status: 'confirmed' as const,
  type: { value: 'send' as const, displayValue: 'Send' },
  label: null,
  fee: null,
  refund: null,
  acts: [act(0, '13.32462'), act(1, '2.16396'), act(2, '6.19358')],
  content: { transfers: [], approvals: null },
  transaction: { chain, hash: '0x', explorerUrl: null },
};

const revertAction = {
  ...successAction,
  id: '0xe4ba286c5c53494f944b54dfe9c2d959',
  status: 'failed' as const,
  type: { value: 'execute' as const, displayValue: 'Execute' },
  acts: [
    {
      ...act(0, '0'),
      type: { value: 'execute' as const, displayValue: 'Execute' },
      status: 'failed' as const,
      content: { transfers: [], approvals: null },
    },
  ],
  content: { transfers: [], approvals: null },
};

function previewUrl(extensionPopupUrl: string) {
  const params = new URLSearchParams({
    origin: 'https://app.safe.global',
    typedDataRaw: JSON.stringify(typedData),
    windowId: '1',
  });
  return `${extensionPopupUrl}#/signTypedData?${params}`;
}

async function mockSimulation(
  context: BrowserContext,
  action: Record<string, unknown>,
  warnings: Warning[],
) {
  await context.route('**/wallet/simulate-signature/v1*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: { action, warnings } }),
    });
  });
}

function warningCard(page: Page, title: string) {
  return page
    .getByText(title, { exact: true })
    .locator('xpath=ancestor::div[contains(@style, "border-radius: 24px")][1]');
}

test('a clean SafeTx shows the Gray note without Unverified', async ({
  context,
  extensionPopupUrl,
  page,
}) => {
  await mockSimulation(context, successAction, [SAFE_NOTE]);
  await page.goto(previewUrl(extensionPopupUrl));

  const securityButton = page.getByRole('button', { name: 'No Risks Found' });
  await expect(securityButton).toBeVisible({ timeout: 30_000 });
  await expect(page.getByRole('button', { name: 'Unverified' })).toHaveCount(0);

  const safeNote = warningCard(page, 'Safe transaction');
  await expect(safeNote).toBeVisible();
  await expect(safeNote).toHaveAttribute('style', /var\(--neutral-300\)/);

  await securityButton.click();
  await expect(
    page.getByText(
      'Our simulation found no security issues. However, it is always crucial to double-check and proceed with caution.',
    ),
  ).toBeVisible();
  await expect(
    page.getByText(/We were unable to simulate the transaction or complete all security checks/),
  ).toBeHidden();
});

test('an Orange SafeTx warning and the Gray note keep their own styling', async ({
  context,
  extensionPopupUrl,
  page,
}) => {
  await mockSimulation(context, revertAction, [SAFE_NOTE_ORANGE, SAFE_NOTE]);
  await page.goto(previewUrl(extensionPopupUrl));

  await expect(page.getByRole('button', { name: 'Risks Found' })).toBeVisible({ timeout: 30_000 });

  const orangeCard = warningCard(page, 'This transaction will fail');
  const grayCard = warningCard(page, 'Safe transaction');
  await expect(orangeCard).toBeVisible();
  await expect(grayCard).toBeVisible();
  await expect(orangeCard).toHaveAttribute('style', /var\(--negative-300\)/);
  await expect(grayCard).toHaveAttribute('style', /var\(--neutral-300\)/);

  const cancel = page.getByRole('button', { name: 'Cancel' });
  await expect(cancel).toBeEnabled();
  await cancel.click();
  await expect(page.getByRole('button', { name: 'Risks Found' })).toBeVisible();
});

test('repeated warning titles do not produce duplicate-key warnings', async ({
  context,
  extensionPopupUrl,
  page,
}) => {
  const consoleErrors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') {
      consoleErrors.push(message.text());
    }
  });

  const repeated: Warning[] = [
    { severity: 'Red', title: 'Safe settings change', description: 'First change', details: '' },
    { severity: 'Red', title: 'Safe settings change', description: 'Second change', details: '' },
  ];
  await mockSimulation(context, successAction, repeated);
  await page.goto(previewUrl(extensionPopupUrl));

  await expect(page.getByText('Safe settings change', { exact: true })).toHaveCount(2, {
    timeout: 30_000,
  });
  await expect(page.getByText('First change')).toBeVisible();
  await expect(page.getByText('Second change')).toBeVisible();
  expect(
    consoleErrors.filter((text) => /Encountered two children with the same key/.test(text)),
  ).toEqual([]);
});

function assetLinks(page: Page) {
  return page.locator('a[href*="/explore/asset/"]');
}

async function assetLinkHrefs(page: Page) {
  return assetLinks(page).evaluateAll((anchors) =>
    anchors.map((anchor) => anchor.getAttribute('href') || ''),
  );
}

test('a SafeTx preview attributes the balance changes to the Safe', async ({
  context,
  extensionPopupUrl,
  page,
}) => {
  await mockSimulation(context, successAction, [SAFE_NOTE]);
  await page.goto(previewUrl(extensionPopupUrl));

  await expect(page.getByText('Balance changes shown for Safe')).toBeVisible({
    timeout: 30_000,
  });

  // The truncated address copies the full Safe address, not the signer's.
  const safeCopy = page.getByRole('button', { name: SAFE_ADDRESS_SHORT });
  await expect(safeCopy).toHaveAttribute('title', SAFE_ADDRESS);
  await safeCopy.click();
  await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe(SAFE_ADDRESS);

  // Every previewed asset belongs to the Safe's portfolio, not the signer's.
  const hrefs = await assetLinkHrefs(page);
  expect(hrefs).toHaveLength(3);
  for (const href of hrefs) {
    expect(href).toContain(`address=${SAFE_ADDRESS}`);
  }

  // The Gray note stays visible next to the attribution.
  await expect(warningCard(page, 'Safe transaction')).toBeVisible();
});

test('a reverted SafeTx keeps the Safe attribution and the Gray note', async ({
  context,
  extensionPopupUrl,
  page,
}) => {
  await mockSimulation(context, revertAction, [SAFE_NOTE_ORANGE, SAFE_NOTE]);
  await page.goto(previewUrl(extensionPopupUrl));

  await expect(page.getByRole('button', { name: 'Risks Found' })).toBeVisible({
    timeout: 30_000,
  });
  await expect(warningCard(page, 'Safe transaction')).toBeVisible();
  await expect(page.getByText('Balance changes shown for Safe')).toBeVisible();
  await expect(page.getByRole('button', { name: SAFE_ADDRESS_SHORT })).toHaveAttribute(
    'title',
    SAFE_ADDRESS,
  );
});

test('an action for the signing wallet shows no Safe line and links to the wallet', async ({
  context,
  extensionPopupUrl,
  page,
  onboardingWallet,
}) => {
  await mockSimulation(context, { ...successAction, address: onboardingWallet.address }, []);
  await page.goto(previewUrl(extensionPopupUrl));

  await expect(assetLinks(page)).toHaveCount(3, { timeout: 30_000 });
  await expect(page.getByText('Balance changes shown for Safe')).toHaveCount(0);

  const hrefs = await assetLinkHrefs(page);
  expect(hrefs).toHaveLength(3);
  for (const href of hrefs) {
    expect(href).toContain(`address=${onboardingWallet.address}`);
  }
});
