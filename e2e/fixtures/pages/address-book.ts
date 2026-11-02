import { expect } from '@playwright/test';
import { ExtensionPage } from './extension-page';

export class AddressBookPage extends ExtensionPage {
  readonly addFirstAddressButton = this.page.getByRole('button', {
    name: /Add First Address/i,
  });
  readonly addAddressButton = this.page.getByRole('button', {
    name: /Add Address/i,
  });

  async addAddress({
    address,
    name,
  }: {
    address: string;
    name: string;
  }): Promise<void> {
    await this.addFirstAddressButton.or(this.addAddressButton).click();

    const picker = this.page.getByRole('dialog');
    await picker.getByRole('combobox').fill(address);
    await picker.getByRole('option').filter({ hasText: address }).click();

    await this.page.getByRole('textbox').fill(name);
    await this.page.getByRole('button', { name: /Save/i }).click();

    await expect(this.page.getByText(name)).toBeVisible();
  }
}
