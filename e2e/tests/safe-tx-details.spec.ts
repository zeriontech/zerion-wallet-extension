import { expect } from '@playwright/test';
import type { BrowserContext, Page } from '@playwright/test';
import { createExtensionTest } from './test';
import {
  BASE_DOMAIN_HASH,
  BASE_MESSAGE_HASH,
  BASE_SAFE,
  BASE_SAFE_TX_HASH,
  BASE_TRANSFER_RECIPIENT,
  BASE_TYPED_DATA,
  BASE_USDC,
  ETHEREUM_MULTISEND_TYPED_DATA,
  ETHEREUM_SAFE_TX_HASH,
} from '../../src/modules/ethereum/message-signing/safeTxFixtures';
import type { TypedData } from '../../src/modules/ethereum/message-signing/TypedData';

const test = createExtensionTest();

/**
 * The SafeTx details section decodes the calls, the refund and the three
 * Ledger hashes from the typed data alone. The typed data is the pinned
 * public base-1.4.1 vector (a 250 USDC transfer from the Safe); the signer is
 * a real Ledger device account created through the same background import
 * method the hardware onboarding flow uses, so no synthetic UI flag decides
 * the section.
 */

const SAFE_APP_ORIGIN = 'https://app.safe.global';
const LEDGER_ADDRESS = '0xA218A8346454c982912Cf6d14c714663C2d510D8';
const LEDGER_DERIVATION_PATH = "m/44'/60'/0'/0/0";

const PERMIT_TYPED_DATA: TypedData = {
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
    verifyingContract: BASE_USDC,
  },
  primaryType: 'Permit',
  message: {
    owner: LEDGER_ADDRESS,
    spender: '0x0000000000000000000000000000000000000001',
    value: '1000000',
    nonce: 0,
    deadline: 1_800_000_000,
  },
};

function previewUrl(extensionPopupUrl: string, typedData: unknown, origin = SAFE_APP_ORIGIN) {
  const params = new URLSearchParams({
    origin,
    typedDataRaw: JSON.stringify(typedData),
    windowId: '1',
  });
  return `${extensionPopupUrl}#/signTypedData?${params}`;
}

async function walletRequest(page: Page, method: string, params: Record<string, unknown>) {
  return page.evaluate(
    async ({ method, params }) => {
      const port = chrome.runtime.connect({
        name: `${chrome.runtime.id}/wallet`,
      });
      const id = 1;
      return new Promise((resolve, reject) => {
        port.onMessage.addListener((message) => {
          if (message?.id !== id) return;
          if (message.error) {
            reject(new Error(JSON.stringify(message.error)));
          } else {
            resolve(message.result);
          }
        });
        port.postMessage({ jsonrpc: '2.0', id, method, params });
      });
    },
    { method, params },
  );
}

async function accountRequest(page: Page, method: string) {
  return page.evaluate(
    async ({ method }) => {
      const port = chrome.runtime.connect({ name: 'accountPublicRPC' });
      const id = 1;
      return new Promise((resolve, reject) => {
        port.onMessage.addListener((message) => {
          if (message?.id !== id) return;
          if (message.error) {
            reject(new Error(JSON.stringify(message.error)));
          } else {
            resolve(message.result);
          }
        });
        port.postMessage({ jsonrpc: '2.0', id, method, params: {} });
      });
    },
    { method },
  );
}

/**
 * Creates a Ledger account through `uiImportHardwareWallet` — the background
 * method `HardwareWalletConnectionStart` calls after a device import — then
 * saves it and makes it current. No device is required; the persisted record
 * is the same one a real USB import writes.
 */
async function importLedgerAccount(page: Page, extensionPopupUrl: string) {
  await page.goto(extensionPopupUrl, { waitUntil: 'domcontentloaded' });
  await walletRequest(page, 'uiImportHardwareWallet', {
    accounts: [
      {
        address: LEDGER_ADDRESS,
        derivationPath: LEDGER_DERIVATION_PATH,
        name: 'Ledger 1',
      },
    ],
    device: { vendorId: 0x2c97, productId: 0x4011, productName: 'Ledger Nano X' },
    provider: 'ledger',
  });
  await accountRequest(page, 'saveUserAndWallet');
  await walletRequest(page, 'setCurrentAddress', { address: LEDGER_ADDRESS });
  // The popup is a single document; leaving it forces the next page load to
  // read the freshly imported account instead of the cached pre-import one.
  await page.goto('about:blank');
}

async function mockSimulation(context: BrowserContext) {
  await context.route('**/wallet/simulate-signature/v1*', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: { action: null, warnings: [] } }),
    }),
  );
}

async function mockSimulationFailure(context: BrowserContext) {
  await context.route('**/wallet/simulate-signature/v1*', (route) =>
    route.fulfill({ status: 500, contentType: 'application/json', body: '{}' }),
  );
}

function signButton(page: Page) {
  return page.getByRole('button', { name: /Sign with Ledger|^Sign$/ });
}

test('shows the decoded transfer and the three Ledger hashes', async ({
  context,
  extensionPopupUrl,
  page,
}) => {
  await mockSimulation(context);
  await importLedgerAccount(page, extensionPopupUrl);
  await page.goto(previewUrl(extensionPopupUrl, BASE_TYPED_DATA));

  const details = page.getByText('Safe transaction details', { exact: true });
  await expect(details).toBeVisible({ timeout: 30_000 });

  // Safe and nonce come from the typed data. The domain case shows the
  // page-level network row (icon plus name) exactly once; the details block
  // deliberately omits its own Network row.
  await expect(page.getByText(BASE_SAFE, { exact: true })).toBeVisible();
  await expect(page.getByText('Base', { exact: true })).toHaveCount(1);
  await expect(page.getByText('Network', { exact: true })).toHaveCount(0);
  await expect(page.getByText('Nonce', { exact: true })).toBeVisible();
  await expect(page.getByText('78', { exact: true })).toBeVisible();

  // The single operation-0 call is a USDC transfer with the raw amount and
  // the recipient encoded in the calldata
  await expect(page.getByText('Token transfer', { exact: true })).toBeVisible();
  await expect(page.getByText(BASE_USDC, { exact: true })).toBeVisible();
  await expect(page.getByText('250000000', { exact: true })).toBeVisible();
  await expect(page.getByText(BASE_TRANSFER_RECIPIENT, { exact: true })).toBeVisible();

  // No refund fields are non-zero in the pinned vector
  await expect(page.getByText('Refund', { exact: true })).toHaveCount(0);

  // The three hashes a Ledger shows, full length
  await expect(page.getByText(BASE_SAFE_TX_HASH, { exact: true })).toBeVisible();
  await expect(page.getByText(BASE_DOMAIN_HASH, { exact: true })).toBeVisible();
  await expect(page.getByText(BASE_MESSAGE_HASH, { exact: true })).toBeVisible();

  // The details never gate signing
  await expect(signButton(page)).toBeEnabled();

  // A non-canonical payload is unchanged: no section
  await page.goto(previewUrl(extensionPopupUrl, PERMIT_TYPED_DATA));
  await expect(page.getByText('Permit', { exact: true })).toBeVisible();
  await expect(page.getByText('Safe transaction details')).toHaveCount(0);

  // The origin gate is exact
  await page.goto(
    previewUrl(extensionPopupUrl, BASE_TYPED_DATA, 'https://app.safe.global.example'),
  );
  await page.reload();
  await expect(page.getByRole('button', { name: /Data/ })).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText('Safe transaction details')).toHaveCount(0);
});

test('shows every inner call of a MultiSend batch', async ({
  context,
  extensionPopupUrl,
  page,
}) => {
  await mockSimulation(context);
  await importLedgerAccount(page, extensionPopupUrl);
  await page.goto(previewUrl(extensionPopupUrl, ETHEREUM_MULTISEND_TYPED_DATA));

  await expect(page.getByText('Safe transaction details', { exact: true })).toBeVisible({
    timeout: 30_000,
  });

  // The page-level domain row is the only network display
  await expect(page.getByText('Ethereum', { exact: true })).toHaveCount(1);
  await expect(page.getByText('Network', { exact: true })).toHaveCount(0);
  await expect(page.getByText('3519', { exact: true })).toBeVisible();
  await expect(page.getByText('Contract call', { exact: true })).toHaveCount(2);

  // Both calls of the pinned ethereum-1.4.1-multisend vector
  await expect(page.getByText('0x0dc4f92879b7670e5f4e4e6e3c801d229129d90d')).toBeVisible();
  await expect(page.getByText('0xf80eeec09f417fa7fcc4a848ef03af9df2658d7b')).toBeVisible();
  await expect(page.getByText(/^0x095ea7b3/)).toBeVisible();
  await expect(page.getByText(/^0x2608f818/)).toBeVisible();

  await expect(page.getByText(ETHEREUM_SAFE_TX_HASH, { exact: true })).toBeVisible();
  await expect(page.getByText('Refund', { exact: true })).toHaveCount(0);
  await expect(signButton(page)).toBeEnabled();
});

test('keeps the network row when the preview falls back', async ({
  context,
  extensionPopupUrl,
  page,
}) => {
  await mockSimulation(context);
  await importLedgerAccount(page, extensionPopupUrl);
  // A canonical SafeTx on a chain the wallet does not know keeps the origin
  // chain preview, so the page-level row is hidden and the details block must
  // still name the transaction's domain chain.
  const unsupportedChain = structuredClone(BASE_TYPED_DATA);
  unsupportedChain.domain = { ...unsupportedChain.domain, chainId: 999999 };
  await page.goto(previewUrl(extensionPopupUrl, unsupportedChain));

  await expect(page.getByText('Safe transaction details', { exact: true })).toBeVisible({
    timeout: 30_000,
  });
  await expect(page.getByText(BASE_SAFE, { exact: true })).toBeVisible();
  await expect(page.getByText('Network', { exact: true })).toBeVisible();
  await expect(page.getByText('Chain 999999', { exact: true })).toBeVisible();
  await expect(page.getByText('Base', { exact: true })).toHaveCount(0);
  await expect(page.getByText('Ethereum', { exact: true })).toHaveCount(0);
  await expect(page.getByText('Token transfer', { exact: true })).toBeVisible();
  await expect(signButton(page)).toBeEnabled();
});

test('shows the refund row when a refund field is non-zero', async ({
  context,
  extensionPopupUrl,
  page,
}) => {
  await mockSimulation(context);
  await importLedgerAccount(page, extensionPopupUrl);
  // Same public vector with a refund attached: the Safe would pay the refund
  // in USDC, so every refund row is visible.
  const withRefund = structuredClone(BASE_TYPED_DATA);
  withRefund.message = {
    ...withRefund.message,
    gasPrice: '1',
    safeTxGas: '21000',
    baseGas: '5000',
    gasToken: BASE_USDC,
    refundReceiver: LEDGER_ADDRESS,
    nonce: '79',
  };
  await page.goto(previewUrl(extensionPopupUrl, withRefund));

  await expect(page.getByText('Safe transaction details', { exact: true })).toBeVisible({
    timeout: 30_000,
  });
  await expect(page.getByText('Refund', { exact: true })).toBeVisible();
  await expect(page.getByText('Gas price', { exact: true })).toBeVisible();
  await expect(page.getByText('Safe tx gas', { exact: true })).toBeVisible();
  await expect(page.getByText('Base gas', { exact: true })).toBeVisible();
  await expect(page.getByText('Gas token', { exact: true })).toBeVisible();
  await expect(page.getByText('Refund receiver', { exact: true })).toBeVisible();
  await expect(signButton(page)).toBeEnabled();
});

test('stays visible when the simulation fails', async ({ context, extensionPopupUrl, page }) => {
  await mockSimulationFailure(context);
  await importLedgerAccount(page, extensionPopupUrl);
  await page.goto(previewUrl(extensionPopupUrl, BASE_TYPED_DATA));

  await expect(page.getByText('Safe transaction details', { exact: true })).toBeVisible({
    timeout: 30_000,
  });
  await expect(page.getByText(BASE_SAFE_TX_HASH, { exact: true })).toBeVisible();
  await expect(page.getByText(BASE_DOMAIN_HASH, { exact: true })).toBeVisible();
  await expect(page.getByText(BASE_MESSAGE_HASH, { exact: true })).toBeVisible();
  await expect(signButton(page)).toBeEnabled();
});

test('is hidden for a non-device signer', async ({ context, extensionPopupUrl, page }) => {
  await mockSimulation(context);
  await page.goto(previewUrl(extensionPopupUrl, BASE_TYPED_DATA));

  await expect(page.getByRole('button', { name: /Data/ })).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText('Safe transaction details')).toHaveCount(0);
});
