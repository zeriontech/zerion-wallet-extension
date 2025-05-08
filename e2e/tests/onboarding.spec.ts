import {
  generateRandomRecoveryPhrase,
  generateRandomWallet,
} from 'e2e/utils/wallet';
import {
  CreateNewWalletFlow,
  ImportPrivateKeyFlow,
  ImportRecoveryPhraseFlow,
  WelcomePage,
  setPassword,
} from '../fixtures/pages/onboarding';
import { waitForPage } from '../utils/wait';
import { createExtensionTest } from './test';

interface OnboardingFixtures {
  welcomePage: WelcomePage;
  createNewWalletFlow: CreateNewWalletFlow;
  importRecoveryPhraseFlow: ImportRecoveryPhraseFlow;
  importPrivateKeyFlow: ImportPrivateKeyFlow;
}

const extensionTest = createExtensionTest({ onboarding: { auto: false } });
const test = extensionTest.extend<OnboardingFixtures>({
  page: async ({ context }, use) => {
    // We don't need to open onboarding page, because it opens automatically when
    // the extension is installed. See browser.runtime.onInstalled event handlers.
    const page = await waitForPage(context, (page) =>
      page.url().includes('onboarding')
    );
    await use(page);
  },
  welcomePage: async ({ page }, use) => {
    await use(new WelcomePage(page));
  },
  createNewWalletFlow: async ({ page }, use) => {
    await use(new CreateNewWalletFlow(page));
  },
  importRecoveryPhraseFlow: async ({ page }, use) => {
    await use(new ImportRecoveryPhraseFlow(page));
  },
  importPrivateKeyFlow: async ({ page }, use) => {
    await use(new ImportPrivateKeyFlow(page));
  },
});

const { describe } = test;

describe.configure({ mode: 'parallel' });
describe('Onboarding', () => {
  test('Matches snapshot', async ({ welcomePage }) => {
    await welcomePage.matchesSnapshot();
  });

  test('User can create a new wallet and skip backup', async ({
    page,
    welcomePage,
    createNewWalletFlow: flow,
  }) => {
    await welcomePage.createNewWalletLink.click();
    await setPassword(page, 'MyVeryStrongP@ssw0rd');
    const createButton = page.getByRole('button', { name: /Create/i });
    await createButton.click();
    await flow.skipBackup();
    await flow.expectSuccess();
  });

  test('User can create and backup a new wallet', async ({
    page,
    welcomePage,
    createNewWalletFlow: flow,
    password,
  }) => {
    await welcomePage.createNewWalletLink.click();
    await setPassword(page, password);
    const createButton = page.getByRole('button', { name: /Create/i });
    await createButton.click();
    await flow.backupAndVerify();
    await flow.expectSuccess();
  });

  test('User can import an existing wallet using recovery phrase', async ({
    page,
    welcomePage,
    importRecoveryPhraseFlow: flow,
    password,
  }) => {
    await welcomePage.importExistingWalletLink.click();
    await flow.start();
    const phrase = generateRandomRecoveryPhrase();
    await flow.importRecoveryPhrase(phrase);
    await page.getByRole('button', { name: /Continue\.*/i }).click();
    await setPassword(page, password);
    await flow.expectSuccess();
  });

  test('User can import an existing wallet using private key', async ({
    page,
    welcomePage,
    importPrivateKeyFlow: flow,
    password,
  }) => {
    await welcomePage.importExistingWalletLink.click();
    await flow.start();
    const { privateKey } = generateRandomWallet();
    await flow.importPrivateKey(privateKey);
    await setPassword(page, password);
    await flow.expectSuccess();
  });
});
