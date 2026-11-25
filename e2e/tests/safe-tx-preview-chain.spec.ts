import { expect } from '@playwright/test';
import type { BrowserContext, Page } from '@playwright/test';
import { createExtensionTest } from './test';

const test = createExtensionTest();

const SAFE_ADDRESS = '0x4a183b7ED67B9E14b3f45Abfb2Cf44ed22c29E54';
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

// A canonical SafeTx: primaryType, a types.SafeTx entry and a domain chain id.
// app.safe.global signs these on the chain in the domain, which can differ
// from the chain the dapp has selected for its origin.
const safeTxTypedData = {
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
    to: ZERO_ADDRESS,
    value: '0',
    data: '0x',
    operation: 0,
    safeTxGas: '0',
    baseGas: '0',
    gasPrice: '0',
    gasToken: ZERO_ADDRESS,
    refundReceiver: ZERO_ADDRESS,
    nonce: '0',
  },
};

// Not a SafeTx, but it also carries a domain chain id. Such payloads keep the
// dapp's selected chain.
const permitTypedData = {
  types: {
    Permit: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
      { name: 'value', type: 'uint256' },
      { name: 'nonce', type: 'uint256' },
      { name: 'deadline', type: 'uint256' },
    ],
    EIP712Domain: [
      { name: 'name', type: 'string' },
      { name: 'version', type: 'string' },
      { name: 'chainId', type: 'uint256' },
      { name: 'verifyingContract', type: 'address' },
    ],
  },
  domain: {
    name: 'USD Coin',
    version: '2',
    chainId: 8453,
    verifyingContract: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  },
  primaryType: 'Permit',
  message: {
    owner: '0xc3A6672F5c9Ef31E5a086B1C80Ba1Ac73F95Cbb1',
    spender: '0x0000000000000000000000000000000000000001',
    value: '1000000',
    nonce: 0,
    deadline: 1_800_000_000,
  },
};

function previewUrl(extensionPopupUrl: string, typedData: Record<string, unknown>) {
  const params = new URLSearchParams({
    origin: 'https://app.safe.global',
    typedDataRaw: JSON.stringify(typedData),
    windowId: '1',
  });
  return `${extensionPopupUrl}#/signTypedData?${params}`;
}

/** Records the interpret request and answers it with an empty simulation. */
async function recordSimulation(context: BrowserContext) {
  const bodies: Array<{ chain?: string }> = [];
  await context.route('**/wallet/simulate-signature/v1*', async (route) => {
    bodies.push(route.request().postDataJSON());
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: { action: null, warnings: [] } }),
    });
  });
  return bodies;
}

async function openPreview(
  page: Page,
  extensionPopupUrl: string,
  typedData: Record<string, unknown>,
) {
  await page.goto(previewUrl(extensionPopupUrl, typedData));
  await expect(page.getByRole('button', { name: 'No Risks Found' })).toBeVisible({
    timeout: 30_000,
  });
}

test('a canonical SafeTx preview simulates on its domain chain', async ({
  context,
  extensionPopupUrl,
  page,
}) => {
  // The wallet's selected chain for the origin is the Ethereum default.
  const bodies = await recordSimulation(context);
  await openPreview(page, extensionPopupUrl, safeTxTypedData);

  expect(bodies.length).toBeGreaterThan(0);
  expect(bodies[0]?.chain).toBe('base');
  expect(bodies.every((body) => body.chain === 'base')).toBe(true);
});

test('a non-SafeTx payload keeps simulating on the origin chain', async ({
  context,
  extensionPopupUrl,
  page,
}) => {
  const bodies = await recordSimulation(context);
  await openPreview(page, extensionPopupUrl, permitTypedData);

  expect(bodies.length).toBeGreaterThan(0);
  expect(bodies[0]?.chain).toBe('ethereum');
  expect(bodies.every((body) => body.chain === 'ethereum')).toBe(true);
});
