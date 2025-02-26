import { ConnectLedgerPage } from 'e2e/fixtures/pages/connect-ledger';
import { createExtensionTest } from './test';

const extensionTest = createExtensionTest();
const test = extensionTest.extend<{ connectLedgerPage: ConnectLedgerPage }>({
  connectLedgerPage: async ({ extensionPopupUrl, page }, use) => {
    const connectLedgerPage = new ConnectLedgerPage(page, {
      extensionPopupUrl,
      urlContext: { windowType: 'tab' },
      path: '/connect-hardware-wallet',
    });
    await use(connectLedgerPage);
  },
});

const { describe, beforeEach } = test;

describe.configure({ mode: 'parallel' });
describe('Connect Ledger', () => {
  beforeEach(async ({ connectLedgerPage }) => {
    await connectLedgerPage.navigateTo();
  });

  test('Matches snapshot', async ({ connectLedgerPage }) => {
    await connectLedgerPage.matchesSnapshot();
  });
});
