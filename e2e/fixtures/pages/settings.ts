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
  readonly bugReportLink = this.page.getByRole('link', { name: /Bug Report/i });
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
        - navigation:
          - button "Go back"
          - text: Settings
        - link "Manage Wallets":
          - img
          - img
        - link "Connected Sites":
          - img
          - img
        - link "Networks":
          - img
          - img
        - link "Developer Tools":
          - img
          - img
        - link "Zerion Premium":
          - img
          - img
        - link "Invite Friends":
          - img
          - img
        - link "Rewards":
          - img
          - img
        - link "Security":
          - img
          - img
        - link "Appearance":
          - img
          - img
        - link "Preferences":
          - img
          - img
        - link "Experiments":
          - img
          - img
        - link "Support & Feedback":
          - img
          - img
        - link "Bug Report":
          - img
          - img
        - link "What’s New":
          - img
          - img
        - link "Privacy"
        - text: ·
        - link "Terms of use"
        - text: ·
        - button /v1\\.\\d+\\.\\d+-dev/
        - button "Lock Wallet":
          - img
    `);
  }

  async lockWallet() {
    await this.lockWalletButton.click();
  }
}
