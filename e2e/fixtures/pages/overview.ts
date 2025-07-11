import { expect } from '@playwright/test';
import { ExtensionPage } from './extension-page';

export class OverviewPage extends ExtensionPage {
  async ready() {
    await expect(this.page.getByText(/Get started/i)).toBeInViewport();
  }

  async matchesSnapshot() {
    await expect(this.page.locator('html')).toMatchAriaSnapshot(`
      - document:
        - link "0xc3A66…5Cbb1":
          - img
        - button "Copy Address":
          - img
        - link "Rewards":
          - img
        - link "Settings":
          - img
        - button "Open Sidepanel":
          - img
        - text: /\\$\\d+\\.\\d+/
        - list:
          - listitem:
            - link:
              - img
          - listitem:
            - link:
              - img
          - listitem:
            - link:
              - img
          - listitem:
            - link:
              - img
          - listitem:
            - link "Swap":
              - img
        - img "Solana banner decoration"
        - button "close":
          - img
        - img
        - text: Solana is Live! Trade on Solana with Zerion
        - link "Tokens"
        - link "NFTs"
        - link "History"
        - link "Perks"
        - img "Empty Wallet Cover"
        - text: Fund your wallet Buy or transfer crypto to get started
        - link "Buy Crypto with Card"
        - link "Receive from Another Wallet"
    `);
  }
}
