import { expect } from '@playwright/test';
import { ExtensionPage } from '../extension-page';

export class ManageWalletsPage extends ExtensionPage {
  readonly walletGroupsLinks = this.page
    .getByText(/Wallets/i)
    .getByRole('link');
  readonly importedWalletsLinks = this.page
    .getByText(/Imported by Private Key/i)
    .getByRole('link', { name: /0x\.*/ });

  readonly createNewWalletLink = this.page.getByRole('link', {
    name: /Create New Wallet/i,
  });
  readonly importWalletLink = this.page.getByRole('link', {
    name: /Import Wallet to Zerion/i,
  });
  readonly connectLedgerLink = this.page.getByRole('link', {
    name: /Connect Ledger/i,
  });
  readonly addWatchAddressLink = this.page.getByRole('link', {
    name: /Add Watch Address/i,
  });

  readonly eraseAllDataButton = this.page.getByRole('button', {
    name: /Erase All Data/i,
  });

  async matchesSnapshot() {
    await expect(this.page.locator('html')).toMatchAriaSnapshot(`
      - document:
        - navigation:
          - button "Go back"
          - text: Manage Wallets
        - text: Imported by Private Key
        - link /0x[\\w\\W]{5}…[\\w\\W]{5}/:
          - img
        - link "Create New Wallet"
        - link "Import Wallet to Zerion"
        - link "Connect Ledger"
        - link "Add Watch Address"
        - button "Erase All Data"
    `);
  }
}
