import type { BrowserContext, Locator, Page } from '@playwright/test';
import {
  Strength,
  estimatePasswordStrengh,
} from 'src/shared/validation/password-strength';
import { waitForPage } from 'e2e/utils/wait';
import { expect } from '@playwright/test';
import { SeedType } from 'src/shared/SeedType';
import type { TestWallet } from '../types';
import { selectItems } from '../interactions';

export async function setPassword(page: Page, password: string) {
  const passwordInput = page.getByPlaceholder(/at least 6 characters/i);
  const confirmPasswordButton = page.getByRole('button', {
    name: /Confirm Password/i,
  });

  await passwordInput.fill(password);
  await confirmPasswordButton.click();

  const { strength } = estimatePasswordStrengh(password);
  if (strength === Strength.weak) {
    await page.getByRole('link', { name: /Proceed Anyway/i }).click();
  }

  await page.getByPlaceholder(/re-enter password/i).fill(password);
  await page.getByRole('button', { name: /Set Password/i }).click();
}

export class OnboardingPage {
  constructor(public readonly page: Page) {}

  async expectSuccess() {
    await expect(this.page.getByText(/Nicely Done/i)).toBeVisible();
  }
}

async function fillRecoveryPhrase(page: Page, phrase: string) {
  const words = phrase.split(' ');
  for (let i = 0; i < 12; i++) {
    await page.locator(`#word-${i}`).fill(words[i]);
  }
}

export class WelcomePage extends OnboardingPage {
  readonly createNewWalletLink: Locator;
  readonly importExistingWalletLink: Locator;
  readonly connectLedgerLink: Locator;

  constructor(page: Page) {
    super(page);

    this.createNewWalletLink = this.page.getByRole('link', {
      name: /Create New Wallet/i,
    });
    this.importExistingWalletLink = this.page.getByRole('link', {
      name: /Import Existing Wallet/i,
    });
    this.connectLedgerLink = this.page.getByRole('link', {
      name: /Connect Ledger/i,
    });
  }

  async matchesSnapshot() {
    await expect(this.page.locator('html')).toMatchAriaSnapshot(`
      - document:
        - img
        - text: /Welcome to Zerion A wallet for self-custodial humans\\. All your crypto & NFTs\\. \\d+\\+ chains\\./
        - link /Create New Wallet\\.*/:
          - img "Create New Wallet"
          - img
        - link /Import Existing Wallet\\.*/:
          - img "Import Existing Wallet"
          - img
        - link /Connect Ledger\\.*/:
          - img "Connect Ledger"
          - img
    `);
  }
}

export class CreateNewWalletFlow extends OnboardingPage {
  private async continueToBackup() {
    const continueButton = this.page.getByRole('button', { name: /Continue/i });
    await continueButton.click();
    await continueButton.click();
  }

  private async toggleRevealRecoveryPhrase() {
    const revealButton = this.page.locator(
      'button[aria-label="Visually reveal value"]'
    );
    await revealButton.click();
  }

  async backupAndVerify() {
    await this.continueToBackup();
    await this.page.getByRole('button', { name: /Back up now/i }).click();
    await this.toggleRevealRecoveryPhrase();
    await this.page.getByRole('button', { name: /Copy to Clipboard/i }).click();

    const recoveryPhrase = await this.page.evaluate(() =>
      navigator.clipboard.readText()
    );
    await this.page.getByRole('button', { name: /Verify Backup/i }).click();
    await fillRecoveryPhrase(this.page, recoveryPhrase);
    await this.page.getByRole('button', { name: /Verify/i }).click();
  }

  async skipBackup() {
    await this.continueToBackup();
    await this.page.getByRole('button', { name: /Do It Later/i }).click();
  }
}

export class ImportRecoveryPhraseFlow extends OnboardingPage {
  async start() {
    await this.page
      .getByRole('link', { name: /Import Recovery Phrase/i })
      .click();
  }

  async importRecoveryPhrase(phrase: string) {
    await fillRecoveryPhrase(this.page, phrase);
    await this.page.getByRole('button', { name: /Import Wallet/i }).click();
  }

  async selectWallets(count: number) {
    await selectItems({
      items: this.page.getByRole('button', { name: /0x\.*/ }),
      count,
      showMoreLocator: this.page.getByRole('button', { name: /Show More/i }),
      continueLocator: this.page.getByRole('button', { name: /Continue\.*/i }),
    });
  }
}

export class ImportPrivateKeyFlow extends OnboardingPage {
  async start() {
    await this.page.getByRole('link', { name: /Import Private Key/i }).click();
  }

  async importPrivateKey(privateKey: string) {
    await this.page.getByPlaceholder(/Private key/i).fill(privateKey);
    await this.page.getByRole('button', { name: /Import Wallet/i }).click();
  }
}

export async function onboardExistingWallet(
  context: BrowserContext,
  {
    wallet,
    seedType,
    password,
  }: {
    wallet: TestWallet;
    seedType: SeedType;
    password: string;
  }
) {
  const page = await waitForPage(context, (page) =>
    page.url().includes('onboarding')
  );
  const welcomePage = new WelcomePage(page);
  await welcomePage.importExistingWalletLink.click();

  if (seedType === SeedType.privateKey) {
    const flow = new ImportPrivateKeyFlow(page);
    await flow.start();
    await flow.importPrivateKey(wallet.privateKey);
    await setPassword(page, password);
    await flow.expectSuccess();
  } else if (seedType === SeedType.mnemonic) {
    const flow = new ImportRecoveryPhraseFlow(page);
    await flow.start();
    await flow.importRecoveryPhrase(wallet.recoveryPhrase);
    await flow.selectWallets(1);
    await setPassword(page, password);
    await flow.expectSuccess();
  }

  await page.close();
}
