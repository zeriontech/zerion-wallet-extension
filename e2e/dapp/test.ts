import { createExtensionTest } from 'e2e/tests/test';
import { TestDappPage } from 'e2e/fixtures/pages/dapp/test-dapp';

const extensionTest = createExtensionTest();

export const test = extensionTest.extend<{ dapp: TestDappPage }>({
  dapp: async ({ context, page }, use) => {
    const dapp = new TestDappPage(page, context);
    await dapp.goto();
    await use(dapp);
  },
});
