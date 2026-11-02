import { expect } from '@playwright/test';
import { ExtensionPage } from './extension-page';

export class SettingsPage extends ExtensionPage {
  readonly manageWalletsLink = this.page.getByRole('link', {
    name: /Manage Wallets/i,
  });
  readonly connectedSitesLink = this.page.getByRole('link', {
    name: /Connected Sites/i,
  });
  readonly networksLink = this.page.getByRole('link', { name: /Networks/i });
  readonly developerToolsLink = this.page.getByRole('link', {
    name: /Developer Tools/i,
  });

  readonly inviteFriendsLink = this.page.getByRole('link', {
    name: /Invite Friends/i,
  });
  readonly rewardsLink = this.page.getByRole('link', { name: /Rewards/i });
  readonly zerionPremiumLink = this.page.getByRole('link', {
    name: /Zerion Premium/i,
  });

  readonly securityLink = this.page.getByRole('link', { name: /Security/i });
  readonly appearanceLink = this.page.getByRole('link', {
    name: /Appearance/i,
  });
  readonly preferencesLink = this.page.getByRole('link', {
    name: /Preferences/i,
  });
  readonly experimentsLink = this.page.getByRole('link', {
    name: /Experiments/i,
  });

  readonly supportAndFeedbackLink = this.page.getByRole('link', {
    name: /Support & Feedback/i,
  });
  readonly whatsNewLink = this.page.getByRole('link', { name: /What's New/i });

  readonly privacyLink = this.page.getByRole('link', { name: /Privacy/i });
  readonly termsOfUseLink = this.page.getByRole('link', {
    name: /Term of use/i,
  });

  readonly lockWalletButton = this.page.getByRole('button', {
    name: /Lock Wallet/i,
  });

  async matchesSnapshot() {
    await expect(this.page.locator('html')).toMatchAriaSnapshot(`
      - document:
        - button "Open dev menu"
        - navigation:
          - button "Go back"
          - text: Settings
        - link "Manage Wallets":
          - img
          - text: Manage Wallets
          - img
        - link "Address Book":
          - img
          - text: Address Book
          - img
        - link "Connected Sites":
          - img
          - text: Connected Sites
          - img
        - link "Networks":
          - img
          - text: Networks
          - img
        - link "Developer Tools":
          - img
          - text: Developer Tools
          - img
        - link "Playground":
          - img
          - text: Playground
          - img
        - link "Zerion Premium":
          - img
          - text: Zerion Premium
          - img
        - link "Security":
          - img
          - text: Security
          - img
        - link "Privacy":
          - img
          - text: Privacy
          - img
        - link "Appearance":
          - img
          - text: Appearance
          - img
        - link "Preferences":
          - img
          - text: Preferences
          - img
        - link "Experiments":
          - img
          - text: Experiments
          - img
        - link "Support & Feedback":
          - img
          - text: Support & Feedback
          - img
        - link "What’s New":
          - img
          - text: What’s New
          - img
        - link "Privacy"
        - text: ·
        - link "Terms of use"
        - text: ·
        - button /v1\\.\\d+\\.\\d+(-\\w+)?/
        - button "Lock Wallet":
          - img
          - text: Lock Wallet
    `);
  }

  async lockWallet() {
    await this.lockWalletButton.click();
  }
}
