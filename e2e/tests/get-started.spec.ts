import {
  AddReadonlyAddressPage,
  AddressImportMessagesView,
  ExistingWalletOptionsPage,
  GenerateWalletView,
  GetStartedPage,
  ImportWalletView,
  MnemonicImportView,
  PrivateKeyImportView,
  WalletGroupSelectPage,
} from 'e2e/fixtures/pages/get-started';
import { VerifyUserComponent } from 'e2e/fixtures/components/verify-user';
import { testWallets } from 'e2e/fixtures/constants';
import { onboardExistingWallet } from 'e2e/fixtures/pages/onboarding';
import { SeedType } from 'src/shared/SeedType';
import { createExtensionTest } from './test';

interface GetStartedFixtures {
  getStartedPage: GetStartedPage;
}

const extensionTest = createExtensionTest({ onboarding: { auto: false } });
const test = extensionTest.extend<GetStartedFixtures>({
  getStartedPage: async ({ extensionPopupUrl, page }, use) => {
    const getStartedPage = new GetStartedPage(page, {
      extensionPopupUrl,
      path: '/get-started',
    });
    await use(getStartedPage);
  },
});

const { describe, beforeEach } = test;

describe.configure({ mode: 'parallel' });
describe('Get Started', () => {
  describe('Onboarded with private key', () => {
    beforeEach(async ({ context, getStartedPage, password }) => {
      await onboardExistingWallet(context, {
        seedType: SeedType.privateKey,
        wallet: testWallets.alice,
        password,
      });
      await getStartedPage.navigateTo();
    });

    test('Matches snapshot', async ({ getStartedPage }) => {
      await getStartedPage.matchesSnapshot();
    });

    test('User can create a new wallet when there are no existing backups', async ({
      page,
      getStartedPage,
      password,
    }) => {
      await getStartedPage.createNewWalletLink.click();

      const verifyUserPage = new VerifyUserComponent(page);
      await verifyUserPage.matchesSnapshot();
      await verifyUserPage.unlock(password);

      const generateWalletView = new GenerateWalletView(page);
      await generateWalletView.ready();
      await generateWalletView.matchesSnapshot();
      await generateWalletView.finish();
    });
  });

  describe('Onboarded with recovery phrase', () => {
    beforeEach(async ({ context, getStartedPage, password }) => {
      await onboardExistingWallet(context, {
        seedType: SeedType.mnemonic,
        wallet: testWallets.bob,
        password,
      });
      await getStartedPage.navigateTo();
    });

    test('User can import wallets from existing backup', async ({
      page,
      getStartedPage,
      password,
    }) => {
      await getStartedPage.createNewWalletLink.click();

      const walletGroupSelectPage = new WalletGroupSelectPage(page);
      await walletGroupSelectPage.matchesSnapshot();
      await walletGroupSelectPage.selectBackup(0);

      const verifyUserPage = new VerifyUserComponent(page);
      await verifyUserPage.matchesSnapshot();
      await verifyUserPage.unlock(password);

      const mnemonicImportView = new MnemonicImportView(page);
      await mnemonicImportView.matchesSnapshot();
      await mnemonicImportView.selectWallets(4);

      const addressImportMessagesView = new AddressImportMessagesView(page);
      await addressImportMessagesView.ready();
      await addressImportMessagesView.matchesSnapshot();
      await addressImportMessagesView.finish();
    });

    test('User can create a new backup', async ({
      page,
      getStartedPage,
      password,
    }) => {
      await getStartedPage.createNewWalletLink.click();

      const walletGroupSelectPage = new WalletGroupSelectPage(page);
      await walletGroupSelectPage.matchesSnapshot();
      await walletGroupSelectPage.createNewBackupLink.click();

      const verifyUserPage = new VerifyUserComponent(page);
      await verifyUserPage.matchesSnapshot();
      await verifyUserPage.unlock(password);

      const generateWalletView = new GenerateWalletView(page);
      await generateWalletView.ready();
      await generateWalletView.matchesSnapshot();
      await generateWalletView.finish();
    });

    test('User can import existing wallet using private key', async ({
      page,
      getStartedPage,
    }) => {
      await getStartedPage.addExistingWalletLink.click();

      const existingWalletOptionsPage = new ExistingWalletOptionsPage(page);
      await existingWalletOptionsPage.matchesSnapshot();
      await existingWalletOptionsPage.importWalletLink.click();

      const importWalletView = new ImportWalletView(page);
      await importWalletView.matchesSnapshot();
      await importWalletView.phraseOrPrivateKeyInput.fill(
        testWallets.charlie.privateKey
      );
      await importWalletView.importButton.click();

      const privateKeyImportView = new PrivateKeyImportView(page);
      await privateKeyImportView.ready();
      await privateKeyImportView.matchesSnapshot();
      await privateKeyImportView.finish();
    });

    test('User can import existing wallet using recovery phrase', async ({
      page,
      getStartedPage,
      password,
    }) => {
      await getStartedPage.addExistingWalletLink.click();

      const existingWalletOptionsPage = new ExistingWalletOptionsPage(page);
      await existingWalletOptionsPage.matchesSnapshot();
      await existingWalletOptionsPage.importWalletLink.click();

      const importWalletView = new ImportWalletView(page);
      await importWalletView.matchesSnapshot();
      await importWalletView.phraseOrPrivateKeyInput.fill(
        testWallets.charlie.recoveryPhrase
      );
      await importWalletView.importButton.click();

      const verifyUserPage = new VerifyUserComponent(page);
      await verifyUserPage.matchesSnapshot();
      await verifyUserPage.unlock(password);

      const mnemonicImportView = new MnemonicImportView(page);
      await mnemonicImportView.matchesSnapshot();
      await mnemonicImportView.selectWallets(4);

      const addressImportMessagesView = new AddressImportMessagesView(page);
      await addressImportMessagesView.ready();
      await addressImportMessagesView.matchesSnapshot();
      await addressImportMessagesView.finish();
    });

    test('User can add watch address', async ({ page, getStartedPage }) => {
      await getStartedPage.addExistingWalletLink.click();

      const existingWalletOptionsPage = new ExistingWalletOptionsPage(page);
      await existingWalletOptionsPage.matchesSnapshot();
      await existingWalletOptionsPage.watchAddressLink.click();

      const addReadonlyAddressPage = new AddReadonlyAddressPage(page);
      await addReadonlyAddressPage.matchesSnapshot();
      await addReadonlyAddressPage.addressInput.fill(
        testWallets.charlie.address
      );
      await addReadonlyAddressPage.continueButton.click();
    });
  });
});
