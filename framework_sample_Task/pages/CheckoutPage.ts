import { Page, Locator } from '@playwright/test';

export class CheckoutPage {
  readonly page: Page;
  readonly firstNameInput: Locator;
  readonly lastNameInput: Locator;
  readonly zipCodeInput: Locator;
  readonly continueButton: Locator;
  readonly finishButton: Locator;
  readonly errorMessage: Locator;
  readonly itemSubtotal: Locator;
  readonly tax: Locator;
  readonly total: Locator;
  readonly confirmationMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.firstNameInput = page.locator('[data-test="firstName"]');
    this.lastNameInput = page.locator('[data-test="lastName"]');
    this.zipCodeInput = page.locator('[data-test="postalCode"]');
    this.continueButton = page.locator('[data-test="continue"]');
    this.finishButton = page.locator('[data-test="finish"]');
    this.errorMessage = page.locator('[data-test="error"]');
    this.itemSubtotal = page.locator('.summary_subtotal_label');
    this.tax = page.locator('.summary_tax_label');
    this.total = page.locator('.summary_total_label');
    this.confirmationMessage = page.locator('.complete-header');
  }

  async fillCheckoutInfo(firstName: string, lastName: string, zipCode: string) {
    await this.firstNameInput.fill(firstName);
    await this.lastNameInput.fill(lastName);
    await this.zipCodeInput.fill(zipCode);
  }

  async continue() {
    await this.continueButton.click();
  }

  async finish() {
    await this.finishButton.click();
  }

  async getSubtotal(): Promise<number> {
    const text = await this.itemSubtotal.textContent();
    return parseFloat(text?.replace('Item total: $', '') || '0');
  }

  async getTax(): Promise<number> {
    const text = await this.tax.textContent();
    return parseFloat(text?.replace('Tax: $', '') || '0');
  }

  async getTotal(): Promise<number> {
    const text = await this.total.textContent();
    return parseFloat(text?.replace('Total: $', '') || '0');
  }

  async getConfirmationMessage() {
    return await this.confirmationMessage.textContent();
  }

  async getErrorMessage() {
    return await this.errorMessage.textContent();
  }
}
