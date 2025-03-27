import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';
import { selectItems } from 'e2e/fixtures/interactions';
import { ExtensionPage } from './extension-page';

export class GetStartedPage extends ExtensionPage {
  readonly createNewWalletLink = this.page.getByRole('link', {
    name: /Create New Wallet/i,
  });
  readonly addExistingWalletLink = this.page.getByRole('link', {
    name: /Add Existing Wallet/i,
  });

  async matchesSnapshot() {
    await expect(this.page.locator('html')).toMatchAriaSnapshot(`
      - document:
        - navigation:
          - button "Go back"
        - img
        - text: Add Wallet Choose an option to set up your wallet
        - link "Create New Wallet"
        - link "Add Existing Wallet"
    `);
  }
}

export class WalletGroupSelectPage {
  readonly walletGroupsLinks = this.page.getByRole('link', {
    name: /\.*0x\.*/,
  });

  readonly createNewBackupLink = this.page.getByRole('link', {
    name: /Create New Backup/i,
  });

  constructor(public readonly page: Page) {}

  async matchesSnapshot() {
    await expect(this.page.locator('html')).toMatchAriaSnapshot(`
      - document:
        - navigation:
          - button "Go back"
        - text: Select Backup
        - 'link /Wallet Group #1 0x[\\w\\W]{4}…[\\w\\W]{4}/':
          - img
        - link "Create New Backup":
          - img
    `);
  }

  async selectBackup(n: number) {
    await this.walletGroupsLinks.nth(n).click();
  }
}

export class ExistingWalletOptionsPage {
  readonly importWalletLink = this.page.getByRole('link', {
    name: /Import Wallet/i,
  });
  readonly connectLedgerLink = this.page.getByRole('link', {
    name: /Connect Ledger/i,
  });
  readonly watchAddressLink = this.page.getByRole('link', {
    name: /Watch Address/i,
  });

  constructor(public readonly page: Page) {}

  async matchesSnapshot() {
    await expect(this.page.locator('html')).toMatchAriaSnapshot(`
      - document:
        - navigation:
          - button "Go back"
          - text: Add Existing Wallet
        - img
        - text: Add Wallet Choose an option to set up your wallet
        - link "Import Wallet":
          - img
          - img
        - link "Connect Ledger":
          - img
          - img
        - link "Watch Address":
          - img
          - img
    `);
  }
}

export class ImportWalletView {
  readonly phraseOrPrivateKeyInput = this.page.getByPlaceholder(
    /Recovery phrase or a private key/i
  );
  readonly importButton = this.page.getByRole('button', {
    name: /Import/i,
  });

  constructor(public readonly page: Page) {}

  async matchesSnapshot() {
    await expect(this.page.locator('html')).toMatchAriaSnapshot(`
      - document:
        - navigation:
          - button "Go back"
          - text: Import Wallet
        - text: Enter Recovery Phrase
        - img
        - text: or a Private Key
        - img
        - text: Use spaces between words if using a recovery phrase
        - textbox "Use spaces between words if using a recovery phrase"
        - img
        - text: Zerion passed security audits
        - button "Import"
    `);
  }
}

export class PrivateKeyImportView {
  constructor(public readonly page: Page) {}

  async ready() {
    await expect(
      this.page.getByRole('button', { name: /Finish/i })
    ).toBeEnabled();
  }

  async matchesSnapshot() {
    await expect(this.page.locator('html')).toMatchAriaSnapshot(`
      - document:
        - navigation:
          - button "Go back"
          - text: Private Key
        - img
        - text: Hi 👋 We're generating your wallet and making sure it's encrypted with your passcode. This should only take a couple of minutes.
        - img
        - text: All done! Your wallet has been imported 🚀 You can now use 0x04d9a18e…C03F55e0
        - button "Finish"
    `);
  }

  async finish() {
    await this.page.getByRole('button', { name: /Finish/i }).click();
  }
}

export class MnemonicImportView {
  constructor(public readonly page: Page) {}

  async matchesSnapshot() {
    await expect(this.page.locator('html')).toMatchAriaSnapshot(`
      - document:
        - navigation:
          - button "Go back"
          - text: Wallets Ready to Import
        - text: We found these wallets associated with your recovery phrase Inactive wallets
        - button /0 0x[\\w\\W]{5}…[\\w\\W]{5}( Already added)?/
        - button /1 0x[\\w\\W]{5}…[\\w\\W]{5}/:
          - img
        - button /2 0x[\\w\\W]{5}…[\\w\\W]{5}/:
          - img
        - button "Show More"
        - button "Continue" [disabled]
    `);
  }

  async selectWallets(count: number) {
    await selectItems({
      items: this.page
        .getByRole('button', { name: /0x\.*/ })
        .filter({ hasNotText: /Already added/i }),
      count,
      showMoreLocator: this.page.getByRole('button', { name: /Show More/i }),
      continueLocator: this.page.getByRole('button', { name: /Continue\.*/i }),
    });
  }
}

export class GenerateWalletView {
  constructor(public readonly page: Page) {}

  async ready() {
    await expect(
      this.page.getByRole('link', { name: /Finish/i })
    ).toBeInViewport();
  }

  async matchesSnapshot() {
    await expect(this.page.locator('html')).toMatchAriaSnapshot(`
      - document:
        - navigation:
          - button "Go back"
        - heading "Get Started" [level=1]
        - img
        - text: Wallet will be encrypted with your password
        - img
        - text: Hi 👋 We're generating your wallet and making sure it's encrypted with your passcode. This should only take a couple of minutes.
        - img
        - text: /All done! Your wallet has been created 🚀 You can now use 0x[\\w\\W]{8}…[\\w\\W]{8}/
        - link "Finish"
    `);
  }

  async finish() {
    await this.page.getByRole('link', { name: /Finish/i }).click();
  }
}

export class AddressImportMessagesView {
  constructor(public readonly page: Page) {}

  async ready() {
    await expect(
      this.page.getByRole('link', { name: /Finish/i })
    ).toBeEnabled();
  }

  async matchesSnapshot() {
    await expect(this.page.locator('html')).toMatchAriaSnapshot(`
      - document:
        - navigation:
          - button "Go back"
          - text: Wallets Ready to Import
        - img
        - text: ⏳ Checking your wallet history on the blockchain... 🔐 Encrypting your wallet with your password...
        - img
        - text: All done! Your wallets have been imported 🚀
        - img
        - text: /Congrats! Welcome on board 0x[\\w\\W]{8}…[\\w\\W]{8} 0x[\\w\\W]{8}…[\\w\\W]{8} 0x[\\w\\W]{8}…[\\w\\W]{8} 0x[\\w\\W]{8}…[\\w\\W]{8}/
        - link "Finish"
    `);
  }

  async finish() {
    await this.page.getByRole('link', { name: /Finish/i }).click();
  }
}

export class AddReadonlyAddressPage {
  readonly addressInput = this.page.getByPlaceholder(
    /Address, domain or identity/i
  );
  readonly continueButton = this.page.getByRole('button', {
    name: /Continue/i,
  });

  constructor(public readonly page: Page) {}

  async matchesSnapshot() {
    await expect(this.page.locator('html')).toMatchAriaSnapshot(`
      - document:
        - navigation:
          - button "Go back"
        - heading "Watch Address" [level=1]
        - text: Search or paste an address, domain or identity to start watching a wallet
        - textbox "Address, domain or identity"
        - button "Continue"
    `);
  }
}
