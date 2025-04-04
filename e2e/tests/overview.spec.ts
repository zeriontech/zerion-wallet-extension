import { OverviewPage } from '../fixtures/pages/overview';
import { createExtensionTest } from './test';

interface OverviewFixtures {
  overviewPage: OverviewPage;
}

const extensionTest = createExtensionTest();
const test = extensionTest.extend<OverviewFixtures>({
  overviewPage: async ({ extensionPopupUrl, page }, use) => {
    await use(new OverviewPage(page, { extensionPopupUrl, path: '/overview' }));
  },
});

const { describe, beforeEach } = test;

describe.skip('Overview', () => {
  beforeEach(async ({ overviewPage }) => {
    await overviewPage.navigateTo();
  });

  test('Matches snapshot', async ({ overviewPage }) => {
    await overviewPage.ready();
    await overviewPage.matchesSnapshot();
  });
});
