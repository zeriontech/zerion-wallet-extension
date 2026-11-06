import { expect } from '@playwright/test';
import { test } from './test';

test.describe.configure({ mode: 'parallel' });

/**
 * These are supported by the test dapp but not by the wallet. The assertions
 * pin the observable rejection so the gap matrix in docs/dapp-e2e.md cannot
 * drift into a false "covered" claim.
 */
test.describe('Unsupported methods and malformed payloads', () => {
  test('unsupported signing and transaction methods fail without an approval window', async ({
    dapp,
    onboardingWallet,
  }) => {
    await dapp.approveConnection(onboardingWallet.address);

    await dapp.clickEthSign();
    await expect(dapp.ethSignButton).toContainText('Error: eth_sign: Not Implemented');

    await dapp.clickTypedDataV3();
    await expect(dapp.typedDataV3Result).toContainText(
      /does not exist\/is not available|Method not found/,
    );

    await dapp.clickTypedDataV1();
    await expect(dapp.typedDataV1Result).toContainText('Error: eth_signTypedData: Not Implemented');

    await dapp.watchAsset();
    await expect(dapp.watchAssetStatus).toContainText('There was an error adding the token');

    await dapp.sendCalls();
    await expect(dapp.sendCallsError).toContainText(
      /does not exist\/is not available|Method not found/,
    );

    await dapp.expectNoExtensionPages();
  });

  test('malformed personal_sign params are rejected before an approval window', async ({
    dapp,
    onboardingWallet,
  }) => {
    await dapp.approveConnection(onboardingWallet.address);

    const response = await dapp.request('personal_sign', []);
    expect(response.ok).toBe(false);
    if (!response.ok) {
      expect(response.error.message).toMatch(/Invalid params/i);
    }
    await dapp.expectNoExtensionPages();
  });
});
