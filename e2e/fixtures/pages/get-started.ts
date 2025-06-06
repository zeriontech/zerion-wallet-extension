import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';
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
    name: /New Recovery Phrase/i,
  });

  constructor(public readonly page: Page) {}

  async matchesSnapshot() {
    await expect(this.page.locator('html')).toMatchAriaSnapshot(`
      - document:
        - navigation:
          - button "Go back"
        - text: Select Wallet Group
        - button "Each group contains wallets that are associated with same recovery phrase, stored locally on your device. Zerion does not have access to this data. We do not cross-associate wallet addresses or have a way to know that these wallets are grouped."
        - 'link /Wallet Group #1 Ethereum wallets 0x[\\w\\W]{4}…[\\w\\W]{4} Solana wallets [\\w\\W]{4}…[\\w\\W]{4}/':
          - img
          - img
          - img
        - link "New Recovery Phrase":
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
        - link "Import Wallet Add an existing wallet using a recovery phrase or private key.":
          - img
          - img
        - link "Connect Ledger Use your hardware wallet with Zerion.":
          - img
          - img
        - link "Watch Address Follow any wallets to track their onchain activities.":
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
      this.page.getByRole('link', { name: /View Wallet/i })
    ).toBeEnabled();
  }

  async matchesSnapshot() {
    await expect(this.page.locator('html')).toMatchAriaSnapshot(`
      - document:
        - navigation:
          - button "Go back"
          - text: Private Key
        - text: Your wallet is ready Eth · 0x04d9a…F55e0
        - link "View Wallet"
    `);
  }

  async finish() {
    await this.page.getByRole('link', { name: /View Wallet/i }).click();
  }
}

export class MnemonicImportView {
  constructor(public readonly page: Page) {}

  async matchesSnapshot() {
    await expect(this.page.locator('html')).toMatchAriaSnapshot(`
      - document:
        - navigation:
          - button "Go back"
        - text: We didn’t find any active wallets Start with these wallets associated with your recovery phrase
        - img
        - text: Ethereum wallets
        - button /0x.+/:
          - img
        - button "Select Another Wallet"
        - button
    `);
  }
}

export class GenerateWalletView {
  constructor(public readonly page: Page) {}

  async ready() {
    await expect(
      this.page.getByRole('link', { name: /View Wallets/i })
    ).toBeInViewport();
  }

  async matchesSnapshot() {
    await expect(this.page.locator('html')).toMatchAriaSnapshot(`
      - document:
        - navigation:
          - button "Go back"
        - text: /Your wallets are ready Eth · 0x[\\w\\W]{5}…[\\w\\W]{5} Sol · [\\w\\W]{5}…[\\w\\W]{5}/
        - link "View Wallets"
    `);
  }

  async finish() {
    await this.page.getByRole('link', { name: /View Wallets/i }).click();
  }
}

export class AddressImportMessagesView {
  constructor(public readonly page: Page) {}

  async ready() {
    await expect(
      this.page.getByRole('link', { name: /View Wallets/i })
    ).toBeEnabled();
  }

  async matchesSnapshot() {
    await expect(this.page.locator('html')).toMatchAriaSnapshot(`
      - document:
        - navigation:
          - button "Go back"
        - text: /Your wallets are ready Eth · 0x[\\w\\W]{5}…[\\w\\W]{5} Sol · [\\w\\W]{5}…[\\w\\W]{5}/
        - link "View Wallets"
    `);
  }

  async finish() {
    await this.page.getByRole('link', { name: /View Wallets/i }).click();
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
