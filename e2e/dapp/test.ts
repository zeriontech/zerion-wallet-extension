import { createExtensionTest } from 'e2e/tests/test';
import { DAPP_URL } from 'e2e/dapp/config';
import { TestDappPage } from 'e2e/fixtures/pages/dapp/test-dapp';

const extensionTest = createExtensionTest();

export const test = extensionTest.extend<{ dapp: TestDappPage }>({
  dapp: async ({ context, page }, use) => {
    const dapp = new TestDappPage(page, context);
    if (DAPP_URL) {
      await dapp.goto();
    }
    await use(dapp);
  },
});

test.beforeEach(() => {
  test.skip(!DAPP_URL, 'DAPP_URL is not set; skipping dapp tests');
});
